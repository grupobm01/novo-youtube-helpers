
-- 1. postback_logs: ensure no client writes possible
REVOKE INSERT, UPDATE, DELETE ON public.postback_logs FROM anon, authenticated;

-- 2. reward_history: remove user insert policy (only SECURITY DEFINER function complete_video_review can insert)
DROP POLICY IF EXISTS "Users can insert own rewards" ON public.reward_history;
REVOKE INSERT, UPDATE, DELETE ON public.reward_history FROM anon, authenticated;

-- 3. video_progress: remove user insert/update policies; only backend logic manages these fields
DROP POLICY IF EXISTS "Users can insert own video progress" ON public.video_progress;
DROP POLICY IF EXISTS "Users can update own video progress" ON public.video_progress;
REVOKE INSERT, UPDATE, DELETE ON public.video_progress FROM anon, authenticated;

-- 4. withdraw_history: validate amount server-side via trigger
CREATE OR REPLACE FUNCTION public.validate_withdraw_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance numeric;
BEGIN
  IF NEW.profile_id <> auth.uid() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;
  IF NEW.amount IS NULL OR NEW.amount <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;
  SELECT balance INTO v_balance FROM public.profiles WHERE id = NEW.profile_id;
  IF v_balance IS NULL OR NEW.amount > v_balance THEN
    RAISE EXCEPTION 'insufficient_balance';
  END IF;
  NEW.status := 'processing';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_withdraw_insert_trigger ON public.withdraw_history;
CREATE TRIGGER validate_withdraw_insert_trigger
  BEFORE INSERT ON public.withdraw_history
  FOR EACH ROW EXECUTE FUNCTION public.validate_withdraw_insert();

-- 5 & 6. Restrict EXECUTE on SECURITY DEFINER functions
-- Internal-only functions: revoke from all client roles
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_first_login() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_withdraw_insert() FROM PUBLIC, anon, authenticated;

-- User-callable functions: revoke from anon, keep authenticated
REVOKE EXECUTE ON FUNCTION public.get_payment_method_decrypted(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.save_payment_method(uuid, text, text, text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.complete_video_review(uuid, text, text, numeric) FROM PUBLIC, anon;
