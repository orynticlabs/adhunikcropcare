CREATE TABLE IF NOT EXISTS storefront_wishlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES storefront_users(id) ON DELETE CASCADE,
  product_slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_slug)
);
CREATE INDEX IF NOT EXISTS storefront_wishlist_items_user_id_idx ON storefront_wishlist_items(user_id);
