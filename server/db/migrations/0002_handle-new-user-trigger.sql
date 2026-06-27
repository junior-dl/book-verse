DROP TRIGGER IF EXISTS on_user_created ON public.user;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profile (auth_user_id, username, avatar_url)
  VALUES (
    NEW.id,
    LOWER(REPLACE(REGEXP_REPLACE(NEW.username, '[^a-zA-Z0-9 ]', '', 'g'), ' ', '-')),
    NEW.image
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_user_created
  AFTER INSERT ON public.user
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();