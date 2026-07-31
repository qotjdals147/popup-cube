-- ISS-033: demo@owner.com owns popup_gucci_01 via stores.owner_id but profiles.store_id pointed at a draft test store.
UPDATE public.profiles
SET store_id = 'popup_gucci_01', updated_at = now()
WHERE id = '203bf9fb-4948-4fff-a644-2f8ce9973b93'
  AND EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = 'popup_gucci_01' AND s.owner_id = profiles.id
  );
