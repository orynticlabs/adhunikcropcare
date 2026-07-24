CREATE TABLE IF NOT EXISTS orycms_reel_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  result text NOT NULL,
  farmer text,
  location text,
  prompt text,
  video_url text NOT NULL,
  poster_url text,
  asset_id text,
  public_id text NOT NULL,
  format text NOT NULL,
  bytes integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'published',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS orycms_reel_videos_status_display_order_idx ON orycms_reel_videos (status, display_order);
CREATE INDEX IF NOT EXISTS orycms_reel_videos_deleted_at_idx ON orycms_reel_videos (deleted_at);
