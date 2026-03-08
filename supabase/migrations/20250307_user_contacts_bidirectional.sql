-- 加好友后双向出现在通讯录：插入 (A,B) 时自动插入 (B,A)
-- 使用 SECURITY DEFINER 以便在触发器中插入「对方」的 user_id 行（否则 RLS 会拒绝）

CREATE OR REPLACE FUNCTION public.user_contacts_insert_symmetric()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 插入反向关系 (contact_user_id, user_id)，若已存在则忽略
  INSERT INTO public.user_contacts (user_id, contact_user_id, created_at)
  VALUES (NEW.contact_user_id, NEW.user_id, NEW.created_at)
  ON CONFLICT (user_id, contact_user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_contacts_after_insert_symmetric ON public.user_contacts;
CREATE TRIGGER user_contacts_after_insert_symmetric
  AFTER INSERT ON public.user_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.user_contacts_insert_symmetric();

-- 历史数据：为已有单向关系补上反向行，使双方互为通讯录
INSERT INTO public.user_contacts (user_id, contact_user_id, created_at)
SELECT c.contact_user_id, c.user_id, c.created_at
FROM public.user_contacts c
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_contacts r
  WHERE r.user_id = c.contact_user_id AND r.contact_user_id = c.user_id
)
ON CONFLICT (user_id, contact_user_id) DO NOTHING;
