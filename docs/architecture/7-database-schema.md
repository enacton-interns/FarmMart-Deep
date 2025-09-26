# 7. Database Schema

This schema is designed for scalability, clarity, and data integrity, separating concerns to provide a robust foundation for the application.

```sql
-- Drop existing types and tables to start fresh (for development environments)
DROP TABLE IF EXISTS order_items, order_status_history, orders, payments, inventory, product_variants, product_media, media, products, product_categories, user_addresses, user_roles, roles, user_profiles, users CASCADE;
DROP TYPE IF EXISTS user_role_enum, order_status_enum, payment_status_enum;

-- ========= Core Types =========
CREATE TYPE "user_role_enum" AS ENUM ('admin', 'farmer', 'customer');
CREATE TYPE "order_status_enum" AS ENUM ('pending_payment', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
CREATE TYPE "payment_status_enum" AS ENUM ('pending', 'succeeded', 'failed');

-- ========= Users & Access Control =========
CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" text UNIQUE NOT NULL,
  "password_hash" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT (now()),
  "updated_at" timestamptz NOT NULL DEFAULT (now()),
  "deleted_at" timestamptz
);
COMMENT ON TABLE "users" IS 'Core user accounts for authentication.';

CREATE TABLE "user_profiles" (
  "user_id" uuid PRIMARY KEY REFERENCES "users"("id") ON DELETE CASCADE,
  "first_name" text,
  "last_name" text,
  "phone_number" text,
  "avatar_url" text,
  "farm_name" text, -- Specific to farmers
  "is_verified" boolean NOT NULL DEFAULT false, -- Specific to farmers
  "updated_at" timestamptz NOT NULL DEFAULT (now())
);
COMMENT ON TABLE "user_profiles" IS 'Stores profile information for all users. Farmer-specific fields can be NULL for other roles.';

CREATE TABLE "roles" (
  "id" serial PRIMARY KEY,
  "name" user_role_enum UNIQUE NOT NULL
);
COMMENT ON TABLE "roles" IS 'Defines the available user roles in the system.';

CREATE TABLE "user_roles" (
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role_id" integer NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
  PRIMARY KEY ("user_id", "role_id")
);
COMMENT ON TABLE "user_roles" IS 'Assigns roles to users, allowing for multiple roles per user.';

CREATE TABLE "user_addresses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "address_line1" text NOT NULL,
  "address_line2" text,
  "city" text NOT NULL,
  "state" text NOT NULL,
  "postal_code" text NOT NULL,
  "country" text NOT NULL,
  "is_default_shipping" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT (now())
);
COMMENT ON TABLE "user_addresses" IS 'Stores shipping or billing addresses for users.';

-- ========= Products & Inventory =========
CREATE TABLE "product_categories" (
  "id" serial PRIMARY KEY,
  "name" text UNIQUE NOT NULL,
  "description" text,
  "parent_category_id" integer REFERENCES "product_categories"("id")
);
COMMENT ON TABLE "product_categories" IS 'Allows for hierarchical categorization of products.';

CREATE TABLE "products" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "farmer_id" uuid NOT NULL REFERENCES "user_profiles"("user_id"),
  "category_id" integer REFERENCES "product_categories"("id"),
  "name" text NOT NULL,
  "description" text,
  "created_at" timestamptz NOT NULL DEFAULT (now()),
  "updated_at" timestamptz NOT NULL DEFAULT (now()),
  "deleted_at" timestamptz
);
COMMENT ON TABLE "products" IS 'The core product entry, representing a type of good a farmer sells.';

CREATE TABLE "product_variants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "sku" text UNIQUE,
  "price_cents" integer NOT NULL CHECK ("price_cents" > 0),
  "currency" char(3) NOT NULL DEFAULT 'USD',
  "attributes" jsonb -- e.g., {"size": "Large", "unit": "dozen"}
);
COMMENT ON TABLE "product_variants" IS 'Represents a specific version of a product, e.g., by size or weight, which has a price and inventory.';

CREATE TABLE "inventory" (
  "variant_id" uuid PRIMARY KEY REFERENCES "product_variants"("id") ON DELETE CASCADE,
  "quantity_available" integer NOT NULL DEFAULT 0 CHECK ("quantity_available" >= 0),
  "updated_at" timestamptz NOT NULL DEFAULT (now())
);
COMMENT ON TABLE "inventory" IS 'Tracks the stock level for each individual product variant.';

-- ========= Media =========
CREATE TABLE "media" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "file_url" text NOT NULL,
  "mime_type" text NOT NULL,
  "uploaded_by_user_id" uuid REFERENCES "users"("id"),
  "created_at" timestamptz NOT NULL DEFAULT (now())
);
COMMENT ON TABLE "media" IS 'Stores references to uploaded files, like product images.';

CREATE TABLE "product_media" (
  "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "media_id" uuid NOT NULL REFERENCES "media"("id") ON DELETE CASCADE,
  "display_order" smallint NOT NULL DEFAULT 0,
  PRIMARY KEY ("product_id", "media_id")
);
COMMENT ON TABLE "product_media" IS 'Links media files to products.';

-- ========= Orders & Payments =========
CREATE TABLE "orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "customer_id" uuid NOT NULL REFERENCES "users"("id"),
  "shipping_address_id" uuid REFERENCES "user_addresses"("id"),
  "total_price_cents" integer NOT NULL,
  "status" order_status_enum NOT NULL DEFAULT 'pending_payment',
  "created_at" timestamptz NOT NULL DEFAULT (now()),
  "updated_at" timestamptz NOT NULL DEFAULT (now())
);
COMMENT ON TABLE "orders" IS 'Represents a single customer order.';

CREATE TABLE "order_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" uuid NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "variant_id" uuid NOT NULL REFERENCES "product_variants"("id"),
  "quantity" integer NOT NULL CHECK ("quantity" > 0),
  "price_at_purchase_cents" integer NOT NULL
);
COMMENT ON TABLE "order_items" IS 'A line item within an order.';

CREATE TABLE "order_status_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" uuid NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "status" order_status_enum NOT NULL,
  "changed_at" timestamptz NOT NULL DEFAULT (now()),
  "notes" text
);
COMMENT ON TABLE "order_status_history" IS 'Audit log for order status changes.';

CREATE TABLE "payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "order_id" uuid NOT NULL REFERENCES "orders"("id"),
  "amount_cents" integer NOT NULL,
  "currency" char(3) NOT NULL DEFAULT 'USD',
  "status" payment_status_enum NOT NULL DEFAULT 'pending',
  "payment_provider" text, -- e.g., 'stripe'
  "provider_payment_id" text, -- ID from the payment provider
  "created_at" timestamptz NOT NULL DEFAULT (now()),
  "updated_at" timestamptz NOT NULL DEFAULT (now())
);
COMMENT ON TABLE "payments" IS 'Records payment transactions for orders.';

-- ========= Indexes for Performance =========
CREATE INDEX ON "user_profiles" ("user_id");
CREATE INDEX ON "user_roles" ("user_id", "role_id");
CREATE INDEX ON "user_addresses" ("user_id");
CREATE INDEX ON "products" ("farmer_id");
CREATE INDEX ON "products" ("category_id");
CREATE INDEX ON "product_variants" ("product_id");
CREATE INDEX ON "product_variants" ("sku");
CREATE INDEX ON "orders" ("customer_id");
CREATE INDEX ON "order_items" ("order_id");
CREATE INDEX ON "order_status_history" ("order_id");
CREATE INDEX ON "payments" ("order_id");

-- Trigger to automatically update 'updated_at' timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$ language 'plpgsql';

-- Apply the trigger to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON "user_profiles" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON "products" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON "inventory" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON "orders" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON "payments" FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
```

***