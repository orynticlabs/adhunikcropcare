import { NextResponse } from "next/server"
import { listOryCMSReelVideos } from "@/lib/orycms/reel-videos"

export const runtime = "nodejs"

export async function GET() {
  try {
    const reelVideos = await listOryCMSReelVideos({ publishedOnly: true })
    const reels = reelVideos.map((reel) => ({
      product: reel.title,
      thumbnail: reel.posterUrl,
      video: reel.videoUrl,
    }))

    return NextResponse.json(
      { success: true, reels },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    )
  } catch {
    return NextResponse.json({ success: true, reels: [] })
  }
}
