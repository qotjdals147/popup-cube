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

CREATE POLICY "return_evidence_insert_own" ON "storage"."objects"
  FOR INSERT
  TO authenticated
  WITH CHECK (((bucket_id = 'return-evidence'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "return_evidence_select" ON "storage"."objects"
  FOR SELECT
  TO authenticated
  USING (((bucket_id = 'return-evidence'::text) AND (((storage.foldername(name))[1] = (auth.uid())::text) OR (EXISTS ( SELECT 1
   FROM (public.order_returns r
     JOIN public.stores s ON ((s.id = r.store_id)))
  WHERE ((s.owner_id = auth.uid()) AND (name = ANY (r.evidence_urls))))))));
