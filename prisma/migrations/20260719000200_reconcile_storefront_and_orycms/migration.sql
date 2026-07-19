-- Idempotent reconciliation migration for databases previously initialized at runtime.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS orycms_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS orycms_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  "passwordHash" text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  "roleId" uuid REFERENCES orycms_roles(id),
  "fullName" text,
  "mobileNumber" text,
  "profilePhoto" text,
  "emailVerified" boolean NOT NULL DEFAULT false,
  "lastLoginAt" timestamptz,
  "deletedAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE orycms_users ADD COLUMN IF NOT EXISTS "fullName" text;
ALTER TABLE orycms_users ADD COLUMN IF NOT EXISTS "mobileNumber" text;
ALTER TABLE orycms_users ADD COLUMN IF NOT EXISTS "profilePhoto" text;
ALTER TABLE orycms_users ADD COLUMN IF NOT EXISTS "emailVerified" boolean NOT NULL DEFAULT false;
ALTER TABLE orycms_users ADD COLUMN IF NOT EXISTS "lastLoginAt" timestamptz;
ALTER TABLE orycms_users ADD COLUMN IF NOT EXISTS "deletedAt" timestamptz;
ALTER TABLE orycms_users ADD COLUMN IF NOT EXISTS "updatedAt" timestamptz NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS orycms_users_deleted_at_idx ON orycms_users ("deletedAt");
CREATE INDEX IF NOT EXISTS orycms_users_status_idx ON orycms_users (status);

CREATE TABLE IF NOT EXISTS orycms_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL REFERENCES orycms_users(id) ON DELETE CASCADE,
  "tokenHash" text NOT NULL UNIQUE,
  "expiresAt" timestamptz NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orycms_sessions_user_id_idx ON orycms_sessions ("userId");

CREATE TABLE IF NOT EXISTS orycms_media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id text NOT NULL UNIQUE,
  public_id text NOT NULL UNIQUE,
  secure_url text NOT NULL,
  width integer,
  height integer,
  format text NOT NULL,
  bytes integer NOT NULL,
  created_at timestamptz NOT NULL,
  original_filename text,
  resource_type text NOT NULL DEFAULT 'image'
);
CREATE INDEX IF NOT EXISTS orycms_media_assets_created_at_idx ON orycms_media_assets (created_at);

CREATE TABLE IF NOT EXISTS orycms_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  parent_id uuid,
  image jsonb,
  display_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  meta_title text,
  meta_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX IF NOT EXISTS orycms_categories_parent_id_idx ON orycms_categories (parent_id);
CREATE INDEX IF NOT EXISTS orycms_categories_status_idx ON orycms_categories (status);
CREATE INDEX IF NOT EXISTS orycms_categories_deleted_at_idx ON orycms_categories (deleted_at);

CREATE TABLE IF NOT EXISTS orycms_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  short_description text NOT NULL,
  full_description text,
  category text NOT NULL,
  brand text,
  sku text NOT NULL UNIQUE,
  price numeric(12,2) NOT NULL,
  sale_price numeric(12,2),
  pack_sizes jsonb NOT NULL DEFAULT '[]'::jsonb,
  stock_quantity integer NOT NULL,
  unit text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  featured boolean NOT NULL DEFAULT false,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  meta_title text,
  meta_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
ALTER TABLE orycms_products ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS orycms_products_status_idx ON orycms_products (status);
CREATE INDEX IF NOT EXISTS orycms_products_category_idx ON orycms_products (category);
CREATE INDEX IF NOT EXISTS orycms_products_deleted_at_idx ON orycms_products (deleted_at);

CREATE TABLE IF NOT EXISTS storefront_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL UNIQUE,
  email_verified_at timestamptz,
  phone text,
  password_hash text NOT NULL,
  avatar text,
  default_address jsonb,
  status text NOT NULL DEFAULT 'active',
  last_login_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE storefront_users ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE storefront_users ADD COLUMN IF NOT EXISTS last_login_at timestamptz;
ALTER TABLE storefront_users ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS storefront_users_status_idx ON storefront_users (status);
CREATE INDEX IF NOT EXISTS storefront_users_deleted_at_idx ON storefront_users (deleted_at);

CREATE TABLE IF NOT EXISTS storefront_refresh_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS storefront_refresh_tokens_user_id_idx ON storefront_refresh_tokens (user_id);

CREATE TABLE IF NOT EXISTS storefront_auth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token_hash text NOT NULL UNIQUE,
  type text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS storefront_auth_tokens_user_id_idx ON storefront_auth_tokens (user_id);

CREATE TABLE IF NOT EXISTS storefront_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  number text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'processing',
  payment_status text NOT NULL DEFAULT 'pending',
  payment_method text NOT NULL DEFAULT 'cash_on_delivery',
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  contact jsonb,
  shipping_address jsonb,
  delivery_method text,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  shipping_total numeric(12,2) NOT NULL DEFAULT 0,
  discount_total numeric(12,2) NOT NULL DEFAULT 0,
  invoice_number text,
  refund_status text NOT NULL DEFAULT 'none',
  cancelled_at timestamptz,
  reservation_expires_at timestamptz,
  stock_released_at timestamptz,
  payment_timeline jsonb NOT NULL DEFAULT '[]'::jsonb,
  tracking text,
  invoice_url text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE storefront_orders ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'cash_on_delivery';
ALTER TABLE storefront_orders ADD COLUMN IF NOT EXISTS razorpay_order_id text;
ALTER TABLE storefront_orders ADD COLUMN IF NOT EXISTS razorpay_payment_id text;
ALTER TABLE storefront_orders ADD COLUMN IF NOT EXISTS razorpay_signature text;
ALTER TABLE storefront_orders ADD COLUMN IF NOT EXISTS contact jsonb;
ALTER TABLE storefront_orders ADD COLUMN IF NOT EXISTS shipping_address jsonb;
ALTER TABLE storefront_orders ADD COLUMN IF NOT EXISTS delivery_method text;
ALTER TABLE storefront_orders ADD COLUMN IF NOT EXISTS subtotal numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE storefront_orders ADD COLUMN IF NOT EXISTS shipping_total numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE storefront_orders ADD COLUMN IF NOT EXISTS discount_total numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE storefront_orders ADD COLUMN IF NOT EXISTS invoice_number text;
ALTER TABLE storefront_orders ADD COLUMN IF NOT EXISTS refund_status text NOT NULL DEFAULT 'none';
ALTER TABLE storefront_orders ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
ALTER TABLE storefront_orders ADD COLUMN IF NOT EXISTS reservation_expires_at timestamptz;
ALTER TABLE storefront_orders ADD COLUMN IF NOT EXISTS stock_released_at timestamptz;
ALTER TABLE storefront_orders ADD COLUMN IF NOT EXISTS payment_timeline jsonb NOT NULL DEFAULT '[]'::jsonb;
CREATE INDEX IF NOT EXISTS storefront_orders_user_id_idx ON storefront_orders (user_id);

CREATE TABLE IF NOT EXISTS storefront_payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  user_id uuid,
  provider text NOT NULL DEFAULT 'razorpay',
  event text NOT NULL,
  status text NOT NULL,
  amount numeric(12,2),
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_refund_id text,
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS storefront_payment_transactions_order_id_idx ON storefront_payment_transactions (order_id);

CREATE TABLE IF NOT EXISTS storefront_idempotency_keys (
  key text PRIMARY KEY,
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  order_id uuid,
  response jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS storefront_email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  type text NOT NULL,
  recipient text NOT NULL,
  provider_id text,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_id, type)
);

CREATE TABLE IF NOT EXISTS storefront_email_preferences (
  user_id uuid PRIMARY KEY,
  disabled_types text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO orycms_roles (name)
VALUES ('Super Admin'), ('Admin'), ('Editor'), ('Manager'), ('Support'), ('Custom')
ON CONFLICT (name) DO NOTHING;
