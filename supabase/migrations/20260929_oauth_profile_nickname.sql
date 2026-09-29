-- Google/OAuth 가입 — profiles.nickname NULL → auth metadata·이메일로 자동 설정 (AD-023 보완)

CREATE OR REPLACE FUNCTION public._ensure_profile_nickname_for(p_user_id uuid)
RETURNS character varying
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
DECLARE
  v_existing character varying;
  v_meta jsonb;
  v_email text;
  v_raw text;
  v_base text;
  v_candidate text;
  v_suffix integer;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT p.nickname INTO v_existing FROM public.profiles p WHERE p.id = p_user_id;
  IF v_existing IS NOT NULL AND btrim(v_existing) <> '' THEN
    RETURN v_existing;
  END IF;

  SELECT u.raw_user_meta_data, u.email INTO v_meta, v_email FROM auth.users u WHERE u.id = p_user_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_raw := COALESCE(
    NULLIF(btrim(v_meta->>'nickname'), ''),
    NULLIF(btrim(v_meta->>'full_name'), ''),
    NULLIF(btrim(v_meta->>'name'), ''),
    NULLIF(btrim(COALESCE(v_meta->>'given_name', '') || COALESCE(v_meta->>'family_name', '')), ''),
    NULLIF(split_part(COALESCE(v_email, ''), '@', 1), '')
  );

  v_base := left(regexp_replace(COALESCE(v_raw, ''), '\s+', '', 'g'), 16);
  IF char_length(v_base) < 2 THEN
    v_base := '손님' || left(replace(p_user_id::text, '-', ''), 6);
  END IF;

  v_candidate := v_base;
  v_suffix := 0;
  WHILE EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.nickname IS NOT NULL
      AND lower(p.nickname) = lower(v_candidate)
      AND p.id <> p_user_id
  ) LOOP
    v_suffix := v_suffix + 1;
    v_candidate := left(v_base, GREATEST(2, 16 - char_length(v_suffix::text))) || v_suffix::text;
    IF v_suffix > 99 THEN
      v_candidate := '손님' || left(replace(p_user_id::text, '-', ''), 8);
      EXIT;
    END IF;
  END LOOP;

  UPDATE public.profiles p
  SET nickname = v_candidate
  WHERE p.id = p_user_id AND (p.nickname IS NULL OR btrim(p.nickname) = '');

  RETURN v_candidate;
END;
$function$;

CREATE OR REPLACE FUNCTION public.ensure_profile_nickname()
RETURNS character varying
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  RETURN public._ensure_profile_nickname_for(auth.uid());
END;
$function$;

REVOKE ALL ON FUNCTION public._ensure_profile_nickname_for(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ensure_profile_nickname() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_profile_nickname() TO authenticated;

-- 기존 OAuth 계정 backfill
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.id
    FROM public.profiles p
    WHERE p.nickname IS NULL OR btrim(p.nickname) = ''
  LOOP
    PERFORM public._ensure_profile_nickname_for(r.id);
  END LOOP;
END;
$$;
