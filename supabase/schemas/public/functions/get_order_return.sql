CREATE OR REPLACE FUNCTION public.get_order_return (
  p_order_id uuid
)
  RETURNS TABLE (
    return_id             uuid,
    order_id              uuid,
    kind                  character varying,
    reason_code           character varying,
    reason_detail         text,
    status                character varying,
    items                 jsonb,
    exchange_memo         text,
    evidence_urls         text[],
    return_recipient_name character varying,
    return_phone          character varying,
    return_postal_code    character varying,
    return_address_line1  character varying,
    return_address_line2  character varying,
    gacha_return_status   character varying,
    owner_reply           text,
    requested_at          timestamp with time zone,
    resolved_at           timestamp with time zone,
    stock_restored        boolean
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public', 'pg_temp'
  AS $function$
DECLARE
  v_user_id uuid;
  v_store_id character varying;
BEGIN
  SELECT o.user_id, o.store_id
  INTO v_user_id, v_store_id
  FROM public.orders o
  WHERE o.id = p_order_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  IF auth.uid() <> v_user_id AND NOT EXISTS (
    SELECT 1 FROM public.stores s WHERE s.id = v_store_id AND s.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    r.id,
    r.order_id,
    r.kind,
    r.reason_code,
    r.reason_detail,
    r.status,
    (
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'order_item_id', elem->>'order_item_id',
            'quantity', GREATEST(1, (elem->>'quantity')::integer),
            'product_name', COALESCE(NULLIF(elem->>'product_name', ''), p.name),
            'option_label', COALESCE(NULLIF(elem->>'option_label', ''), oi.option_label)
          )
          ORDER BY (elem->>'order_item_id')
        ),
        '[]'::jsonb
      )
      FROM jsonb_array_elements(r.items) AS elem
      LEFT JOIN public.order_items oi
        ON oi.id = (elem->>'order_item_id')::uuid
      LEFT JOIN public.products p ON p.id = oi.product_id
    ) AS items,
    r.exchange_memo,
    COALESCE(r.evidence_urls, '{}'::text[]),
    r.return_recipient_name,
    r.return_phone,
    r.return_postal_code,
    r.return_address_line1,
    r.return_address_line2,
    r.gacha_return_status,
    r.owner_reply,
    r.requested_at,
    r.resolved_at,
    r.stock_restored
  FROM public.order_returns r
  WHERE r.order_id = p_order_id
  ORDER BY r.requested_at DESC
  LIMIT 1;
END;
$function$;

GRANT EXECUTE ON FUNCTION "public"."get_order_return"(uuid) TO "authenticated";

REVOKE ALL ON FUNCTION "public"."get_order_return"(uuid) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_order_return"(uuid) TO "postgres";

REVOKE ALL ON FUNCTION "public"."get_order_return"(uuid) FROM PUBLIC, "anon", "service_role";
