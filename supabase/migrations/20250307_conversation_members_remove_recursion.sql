-- 恢复 conversation_members 的 SELECT 策略为仅「看自己的行」，避免与 conversations 的 RLS 形成无限递归。
-- 对话页已用 get_other_conversation_member(conv_id) RPC 获取对方，不再依赖在此看到对方成员。
DROP POLICY IF EXISTS "conversation_members_select_own" ON public.conversation_members;
CREATE POLICY "conversation_members_select_own" ON public.conversation_members
  FOR SELECT USING (user_id = auth.uid());
