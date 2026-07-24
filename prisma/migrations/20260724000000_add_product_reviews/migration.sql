-- CreateTable
CREATE TABLE "storefront_product_reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "product_slug" TEXT NOT NULL,
    "reviewer_name" TEXT NOT NULL,
    "reviewer_email" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storefront_product_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "storefront_product_reviews_product_slug_created_at_idx" ON "storefront_product_reviews"("product_slug", "created_at");
