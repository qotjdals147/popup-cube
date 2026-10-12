-- Foreign keys in a cross-table reference cycle are split out of their
-- table's file: each file loads atomically, so keeping them inline would
-- deadlock the loader (every file would need a table another pending file
-- creates). These statements apply once all referenced tables exist.

ALTER TABLE "public"."orders"
  ADD CONSTRAINT "orders_active_return_id_fkey" FOREIGN KEY (active_return_id) REFERENCES public.order_returns(id) ON DELETE SET NULL;
