
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admins read all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text,
  username text,
  avatar_initial text DEFAULT 'U',
  avatar_color text DEFAULT 'rgb(21, 101, 192)',
  balance numeric(10,2) NOT NULL DEFAULT 240.00,
  in_transit numeric(10,2) NOT NULL DEFAULT 0.00,
  total_paid_out numeric(10,2) NOT NULL DEFAULT 0.00,
  completed_videos integer NOT NULL DEFAULT 0,
  member_since text,
  primeiro_acesso timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Reward history
CREATE TABLE public.reward_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  amount numeric(10,2) NOT NULL DEFAULT 40.00,
  date_label text,
  video_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, video_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reward_history TO authenticated;
GRANT ALL ON public.reward_history TO service_role;
ALTER TABLE public.reward_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own rewards" ON public.reward_history
  FOR SELECT TO authenticated USING (profile_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users insert own rewards" ON public.reward_history
  FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());

-- Withdraw history
CREATE TABLE public.withdraw_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL DEFAULT 0.00,
  status text NOT NULL DEFAULT 'processing',
  date_label text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.withdraw_history TO authenticated;
GRANT ALL ON public.withdraw_history TO service_role;
ALTER TABLE public.withdraw_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own withdrawals" ON public.withdraw_history
  FOR SELECT TO authenticated USING (profile_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users insert own withdrawals" ON public.withdraw_history
  FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());
CREATE POLICY "admins update withdrawals" ON public.withdraw_history
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Video progress
CREATE TABLE public.video_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_id text NOT NULL,
  is_unlocked boolean NOT NULL DEFAULT true,
  unlock_days_remaining integer DEFAULT 21,
  watched boolean NOT NULL DEFAULT false,
  rewarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, video_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_progress TO authenticated;
GRANT ALL ON public.video_progress TO service_role;
ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own video progress" ON public.video_progress
  FOR ALL TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

-- Video likes
CREATE TABLE public.video_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, video_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_likes TO authenticated;
GRANT ALL ON public.video_likes TO service_role;
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own likes" ON public.video_likes
  FOR ALL TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

-- Payment methods
CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  routing_number text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_methods TO authenticated;
GRANT ALL ON public.payment_methods TO service_role;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own payment method" ON public.payment_methods
  FOR ALL TO authenticated USING (profile_id = auth.uid()) WITH CHECK (profile_id = auth.uid());

-- RPC: complete_video_review
CREATE OR REPLACE FUNCTION public.complete_video_review(
  p_profile_id uuid,
  p_video_id text,
  p_title text,
  p_amount numeric
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists boolean;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> p_profile_id THEN
    RETURN jsonb_build_object('success', false, 'reason', 'unauthorized');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.reward_history
    WHERE profile_id = p_profile_id AND video_id = p_video_id
  ) INTO v_exists;

  IF v_exists THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_reviewed');
  END IF;

  INSERT INTO public.reward_history (profile_id, title, amount, video_id, date_label)
  VALUES (p_profile_id, p_title, p_amount, p_video_id,
          to_char(now(), 'Mon DD, YYYY'));

  UPDATE public.profiles
  SET balance = balance + p_amount,
      completed_videos = completed_videos + 1,
      updated_at = now()
  WHERE id = p_profile_id;

  RETURN jsonb_build_object('success', true, 'amount', p_amount);
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_video_review(uuid, text, text, numeric) TO authenticated;

-- Trigger to create profile on new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, username, avatar_initial, member_since)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    split_part(NEW.email, '@', 1),
    UPPER(LEFT(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 1)),
    to_char(now(), 'Mon YYYY')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
