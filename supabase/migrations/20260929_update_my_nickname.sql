-- AD-083 · AD-023 — 마이 › 닉네임 변경 (대소문자 무관 중복 불가, 본인 제외)

CREATE OR REPLACE FUNCTION public.update_my_nickname(p_nickname text)
RETURNS character varying
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_trim text := btrim(p_nickname);
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF char_length(v_trim) < 2 OR char_length(v_trim) > 16 THEN
    RAISE EXCEPTION 'invalid_length';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.nickname IS NOT NULL
      AND lower(p.nickname) = lower(v_trim)
      AND p.id <> v_uid
  ) THEN
    RAISE EXCEPTION 'nickname_taken';
  END IF;

  UPDATE public.profiles p
  SET nickname = v_trim
  WHERE p.id = v_uid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  UPDATE auth.users u
  SET raw_user_meta_data = COALESCE(u.raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('nickname', v_trim)
  WHERE u.id = v_uid;

  RETURN v_trim;
END;
$function$;

REVOKE ALL ON FUNCTION public.update_my_nickname(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_my_nickname(text) TO authenticated;
