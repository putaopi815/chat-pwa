-- 允许查询「自己所在会话」下的所有成员（用于聊天页展示对方信息）
-- 原策略只允许 user_id = auth.uid()，导致只能看到自己一条，拿不到对方 user_id
DROP POLICY IF EXISTS "conversation_members_select_own" ON public.conversation_members;
CREATE POLICY "conversation_members_select_own" ON public.conversation_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.conversation_members m2
      WHERE m2.conversation_id = conversation_members.conversation_id
        AND m2.user_id = auth.uid()
    )
  );
