import "server-only"
import { claimDueJobs, markJobFailed, markJobSucceeded, type ShiprocketJobRow } from "@/lib/shiprocket/jobs"
import { confirmAndCreateShipment, ensureDocument, refreshTracking, schedulePickup, syncShipmentStatus, type DocumentKind } from "@/lib/shiprocket/fulfillment"
import { getShipmentByOrderId } from "@/lib/shiprocket/shipments"
import { sendShipmentNotification, type ShipmentNotificationType } from "@/lib/shiprocket/notifications"

export type RunSummary = { claimed: number; succeeded: number; failed: number }

/** Claims and runs due jobs. Called by the cron endpoint. */
export async function runDueJobs(limit = 10): Promise<RunSummary> {
  const jobs = await claimDueJobs(limit)
  let succeeded = 0
  let failed = 0

  for (const job of jobs) {
    try {
      await runJob(job)
      await markJobSucceeded(job.id)
      succeeded += 1
    } catch (error) {
      console.error(`Shiprocket job ${job.id} (${job.type}) failed`, error)
      await markJobFailed(job, error)
      failed += 1
    }
  }

  return { claimed: jobs.length, succeeded, failed }
}

async function runJob(job: ShiprocketJobRow): Promise<void> {
  switch (job.type) {
    case "create_shipment": {
      if (!job.order_id) throw new Error("create_shipment job missing order_id")
      await confirmAndCreateShipment(job.order_id)
      return
    }
    case "sync_tracking": {
      if (!job.order_id) throw new Error("sync_tracking job missing order_id")
      const shipment = await getShipmentByOrderId(job.order_id)
      if (!shipment) return // Nothing to sync yet; treat as done.
      // Apply the event carried by the webhook payload first (works even before an AWB
      // exists), then poll Shiprocket for any additional activity + tracking metadata.
      const statusLabel = typeof job.payload.statusLabel === "string" ? job.payload.statusLabel : null
      if (statusLabel) {
        await syncShipmentStatus(shipment, {
          statusCode: typeof job.payload.statusCode === "string" ? job.payload.statusCode : null,
          statusLabel,
          location: null,
          activity: statusLabel,
          occurredAt: typeof job.payload.occurredAt === "string" ? job.payload.occurredAt : new Date().toISOString(),
          raw: job.payload,
        })
      }
      await refreshTracking(shipment)
      return
    }
    case "schedule_pickup": {
      if (!job.order_id) throw new Error("schedule_pickup job missing order_id")
      const pickupDate = typeof job.payload.pickupDate === "string" ? job.payload.pickupDate : undefined
      await schedulePickup(job.order_id, pickupDate)
      return
    }
    case "fetch_documents": {
      if (!job.order_id) throw new Error("fetch_documents job missing order_id")
      const kinds = (Array.isArray(job.payload.kinds) ? job.payload.kinds : ["invoice", "label", "manifest"]) as DocumentKind[]
      for (const kind of kinds) {
        await ensureDocument(job.order_id, kind).catch((error) => console.error(`Document ${kind} failed`, error))
      }
      return
    }
    case "send_notification": {
      if (!job.order_id) throw new Error("send_notification job missing order_id")
      const type = job.payload.notificationType as ShipmentNotificationType | undefined
      if (!type) throw new Error("send_notification job missing notificationType")
      await sendShipmentNotification(job.order_id, type)
      return
    }
    default:
      throw new Error(`Unknown Shiprocket job type: ${job.type}`)
  }
}
