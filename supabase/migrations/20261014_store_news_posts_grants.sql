-- AD-088: PostgREST owner CRUD on store_news_posts (RLS still enforces owner_id)

GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_news_posts TO authenticated;
GRANT ALL ON public.store_news_posts TO service_role;
