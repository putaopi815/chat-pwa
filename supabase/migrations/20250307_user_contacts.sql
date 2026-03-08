-- 用户通讯录：当前用户添加的好友（对方 user_id）
-- 仅存储「谁添加了谁」，单向；如需双向好友可再建对称关系或改业务逻辑
CREATE TABLE IF NOT EXISTS public.user_contacts (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, contact_user_id),
  CONSTRAINT no_self_contact CHECK (user_id != contact_user_id)
);

COMMENT ON TABLE public.user_contacts IS '用户通讯录：user_id 添加了 contact_user_id 为好友';

CREATE INDEX IF NOT EXISTS idx_user_contacts_user_id ON public.user_contacts(user_id);

ALTER TABLE public.user_contacts ENABLE ROW LEVEL SECURITY;

-- 只能看、插、删自己的通讯录
DROP POLICY IF EXISTS "user_contacts_select_own" ON public.user_contacts;
CREATE POLICY "user_contacts_select_own" ON public.user_contacts
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_contacts_insert_own" ON public.user_contacts;
CREATE POLICY "user_contacts_insert_own" ON public.user_contacts
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_contacts_delete_own" ON public.user_contacts;
CREATE POLICY "user_contacts_delete_own" ON public.user_contacts
  FOR DELETE USING (user_id = auth.uid());
