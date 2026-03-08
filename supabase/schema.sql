-- =============================================================================
-- 聊天 PWA - Supabase 表结构、索引与 RLS
-- 在 Supabase Dashboard → SQL Editor 中执行
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. profiles（用户资料）
-- -----------------------------------------------------------------------------
-- 作用：用户注册后在此表存昵称、头像、账号 ID 等，与 auth.users 一一对应。
-- 可通过 trigger 在 auth.users 插入时自动创建 profile。
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  account_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS '用户资料：昵称、头像、账号 ID，与 auth.users 一一对应';

CREATE INDEX IF NOT EXISTS idx_profiles_account_id ON public.profiles(account_id);

-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 用户注册时自动创建 profile，并随机分配默认昵称（20 个宝可梦名之一）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_names TEXT[] := ARRAY[
    '皮卡丘','妙蛙种子','妙蛙草','妙蛙花','小火龙','火恐龙','喷火龙','杰尼龟','卡咪龟','水箭龟',
    '绿毛虫','铁甲蛹','巴大蝶','波波','比比鸟','大比鸟','小拉达','拉达','烈雀','大嘴雀'
  ];
  chosen TEXT;
BEGIN
  chosen := default_names[1 + floor(random() * array_length(default_names, 1))::int];
  INSERT INTO public.profiles (id, account_id, display_name)
  VALUES (NEW.id, 'user_' || substr(NEW.id::text, 1, 8), chosen);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 2. conversations（会话）
-- -----------------------------------------------------------------------------
-- 作用：单聊会话。一条记录代表一个会话，通过 conversation_members 关联成员。
-- is_cleared_for_all / cleared_for_all_at / cleared_by 表示「双方聊天记录已清空」状态。
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_cleared_for_all BOOLEAN NOT NULL DEFAULT false,
  cleared_for_all_at TIMESTAMPTZ,
  cleared_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_message_preview TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.conversations IS '单聊会话；is_cleared_for_all 表示双方已清空聊天记录';

CREATE INDEX IF NOT EXISTS idx_conversations_cleared_at ON public.conversations(cleared_for_all_at) WHERE cleared_for_all_at IS NOT NULL;

DROP TRIGGER IF EXISTS conversations_updated_at ON public.conversations;
CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 3. conversation_members（会话成员）
-- -----------------------------------------------------------------------------
-- 作用：多对多关联「用户 ↔ 会话」。用于校验谁可以看该会话、发消息，以及 RLS。
-- 单聊时每条会话对应 2 条 member 记录。
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversation_members (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

COMMENT ON TABLE public.conversation_members IS '会话成员；单聊为 2 人';

CREATE INDEX IF NOT EXISTS idx_conversation_members_user_id ON public.conversation_members(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_members_conversation_id ON public.conversation_members(conversation_id);

-- -----------------------------------------------------------------------------
-- 4. messages（消息）
-- -----------------------------------------------------------------------------
-- 作用：单条消息。status 区分正常/已撤回；单条撤回用 recalled_at、recalled_by；
-- 整会话清空由 conversations 的 is_cleared_for_all 表示，前端可据此展示「聊天记录已清空」。
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'normal' CHECK (status IN ('normal', 'recalled', 'purged_for_all')),
  recalled_at TIMESTAMPTZ,
  recalled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.messages IS '消息；status=recalled 表示单条撤回，recalled_at/recalled_by 记录撤回时间与人';
COMMENT ON COLUMN public.messages.status IS 'normal | recalled';

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);

-- -----------------------------------------------------------------------------
-- 5. RLS（行级安全）- 先删后建，支持重复执行
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- profiles：所有人可读（用于展示昵称/头像），仅本人可改
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- conversations：仅成员可读
DROP POLICY IF EXISTS "conversations_select_member" ON public.conversations;
CREATE POLICY "conversations_select_member" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members m
      WHERE m.conversation_id = conversations.id AND m.user_id = auth.uid()
    )
  );

-- 仅成员可更新（用于 is_cleared_for_all 等）
DROP POLICY IF EXISTS "conversations_update_member" ON public.conversations;
CREATE POLICY "conversations_update_member" ON public.conversations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members m
      WHERE m.conversation_id = conversations.id AND m.user_id = auth.uid()
    )
  );

-- 允许已登录用户创建会话（实际创建后需插入 conversation_members）
DROP POLICY IF EXISTS "conversations_insert_authenticated" ON public.conversations;
CREATE POLICY "conversations_insert_authenticated" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- conversation_members：仅能看自己参与的
DROP POLICY IF EXISTS "conversation_members_select_own" ON public.conversation_members;
CREATE POLICY "conversation_members_select_own" ON public.conversation_members
  FOR SELECT USING (user_id = auth.uid());

-- 仅能插入自己为成员的记录；创建单聊时请调用 create_single_conversation 函数
DROP POLICY IF EXISTS "conversation_members_insert_own" ON public.conversation_members;
CREATE POLICY "conversation_members_insert_own" ON public.conversation_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- 创建单聊：插入会话 + 两条成员记录（当前用户 + 对方），返回 conversation_id
CREATE OR REPLACE FUNCTION public.create_single_conversation(other_user_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  conv_id UUID;
  me_id UUID := auth.uid();
BEGIN
  IF me_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF other_user_id = me_id THEN
    RAISE EXCEPTION 'Cannot create conversation with yourself';
  END IF;
  INSERT INTO public.conversations DEFAULT VALUES RETURNING id INTO conv_id;
  INSERT INTO public.conversation_members (conversation_id, user_id) VALUES (conv_id, me_id), (conv_id, other_user_id);
  RETURN conv_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_single_conversation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_single_conversation(UUID) TO service_role;

-- messages：仅会话成员可读
DROP POLICY IF EXISTS "messages_select_member" ON public.messages;
CREATE POLICY "messages_select_member" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members m
      WHERE m.conversation_id = messages.conversation_id AND m.user_id = auth.uid()
    )
  );

-- 仅会话成员且 sender 为自己可插入
DROP POLICY IF EXISTS "messages_insert_sender" ON public.messages;
CREATE POLICY "messages_insert_sender" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversation_members m
      WHERE m.conversation_id = messages.conversation_id AND m.user_id = auth.uid()
    )
  );

-- 仅本人可更新（用于撤回：把 status 改为 recalled，填 recalled_at/recalled_by）
DROP POLICY IF EXISTS "messages_update_own" ON public.messages;
CREATE POLICY "messages_update_own" ON public.messages
  FOR UPDATE USING (sender_id = auth.uid());

-- 会话成员可将该会话下任意消息更新为 purged_for_all（清空双方记录）
DROP POLICY IF EXISTS "messages_update_purge_for_member" ON public.messages;
CREATE POLICY "messages_update_purge_for_member" ON public.messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members m
      WHERE m.conversation_id = messages.conversation_id AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (status = 'purged_for_all');

-- -----------------------------------------------------------------------------
-- 表与字段说明（每张表的作用）
-- -----------------------------------------------------------------------------
-- profiles
--   用户资料，与 auth.users 一对一。注册后由 trigger 自动插入一行，account_id 默认 user_xxxxxxxx。
--   可更新 display_name、avatar_url、account_id。RLS：所有人可读，仅本人可改。
--
-- conversations
--   单聊会话。id 为会话唯一标识。is_cleared_for_all = true 表示「双方聊天记录已清空」；
--   cleared_for_all_at / cleared_by 记录清空时间与操作人。RLS：仅会话成员可读、可更新。
--
-- conversation_members
--   会话与用户的多对多。一条会话两条记录即单聊。用于 RLS：只有成员能看会话、发消息。
--   创建单聊请调用 create_single_conversation(other_user_id)，不要手插两条 member。
--
-- messages
--   单条消息。status = 'normal' | 'recalled'；单条撤回时置 status=recalled、recalled_at、recalled_by。
--   整会话清空不删消息，只把 conversation 的 is_cleared_for_all 置 true，前端按此展示「聊天记录已清空」。
--   RLS：仅会话成员可读；仅成员且 sender_id=本人可插入；仅 sender 本人可更新（用于撤回）。
