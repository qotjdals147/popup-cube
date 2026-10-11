-- AD-088 — 판매자 상품코드 (엑셀·셀메이트 매칭 키)

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS product_code character varying(40);

COMMENT ON COLUMN public.products.product_code IS '점주 지정 판매자 상품코드 · 매장 내 유일 · 엑셀 「판매자 상품코드」';

CREATE UNIQUE INDEX IF NOT EXISTS products_store_product_code_unique
  ON public.products (store_id, lower(btrim(product_code)))
  WHERE product_code IS NOT NULL AND btrim(product_code::text) <> '';
