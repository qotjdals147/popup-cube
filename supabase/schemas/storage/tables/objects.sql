CREATE POLICY "store_assets_owner_insert" ON "storage"."objects"
  FOR INSERT
  TO PUBLIC
  WITH CHECK (((bucket_id = 'store-assets'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "store_assets_owner_select" ON "storage"."objects"
  FOR SELECT
  TO PUBLIC
  USING (((bucket_id = 'store-assets'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "store_assets_owner_update" ON "storage"."objects"
  FOR UPDATE
  TO PUBLIC
  USING (((bucket_id = 'store-assets'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));
