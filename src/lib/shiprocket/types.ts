export type ShiprocketOrderStatus =
  | "Pending"
  | "Confirmed"
  | "Processing"
  | "Packed"
  | "Shipped"
  | "In Transit"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled"
  | "Returned"
  | "Refunded"

export type ShiprocketSettings = {
  id: string
  apiEmail: string | null
  apiPasswordEncrypted: string | null
  channelId: string | null
  pickupLocation: string | null
  pickupName: string | null
  pickupPhone: string | null
  pickupAddress1: string | null
  pickupAddress2: string | null
  pickupCity: string | null
  pickupState: string | null
  pickupCountry: string
  pickupPincode: string | null
  packageLengthCm: number
  packageBreadthCm: number
  packageHeightCm: number
  packageWeightKg: number
  autoShipOnConfirm: boolean
  enabled: boolean
  createdAt: string
  updatedAt: string
}

/** Settings shape returned to the admin client — the API password is never included. */
export type ShiprocketSettingsPublic = Omit<ShiprocketSettings, "apiPasswordEncrypted"> & {
  apiPasswordSet: boolean
}

export type ShipmentRow = {
  id: string
  order_id: string
  shiprocket_order_id: string | null
  shiprocket_shipment_id: string | null
  awb_code: string | null
  courier_name: string | null
  courier_id: string | null
  status: string
  status_code: string | null
  tracking_url: string | null
  estimated_delivery_date: Date | string | null
  shipping_charge: string | number | null
  pickup_scheduled_date: Date | string | null
  pickup_status: string | null
  pickup_token: string | null
  label_url: string | null
  manifest_url: string | null
  invoice_url: string | null
  retry_count: number
  last_error_code: string | null
  last_error_message: string | null
  last_retry_at: Date | string | null
  raw_response: unknown
  created_at: Date | string
  updated_at: Date | string
}

export type ShipmentEventRow = {
  id: string
  shipment_id: string
  order_id: string
  status: string
  status_code: string | null
  location: string | null
  activity: string | null
  occurred_at: Date | string
  raw: unknown
  created_at: Date | string
}

/** Normalized tracking event from a Shiprocket webhook or tracking API response. */
export type ShiprocketTrackingEvent = {
  statusCode: string | null
  statusLabel: string
  location: string | null
  activity: string | null
  occurredAt: string
  raw: unknown
}
