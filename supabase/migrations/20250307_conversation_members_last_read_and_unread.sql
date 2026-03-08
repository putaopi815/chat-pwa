-- 会话成员增加最后已读时间，用于未读数计算
ALTER TABLE public.conversation_members
  ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ;

COMMENT ON COLUMN public.conversation_members.last_read_at IS '该成员在此会话中最后已读时间；未读 = 对方消息 created_at > last_read_at';

-- 返回当前用户在各会话中的未读数量（仅统计对方发送且未读的 normal 消息）
CREATE OR REPLACE FUNCTION public.get_conversation_unread_counts()
RETURNS TABLE(conversation_id UUID, unread_count BIGINT)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT m.conversation_id, COUNT(*)::BIGINT
  FROM public.conversation_members cm
  JOIN public.messages m
    ON m.conversation_id = cm.conversation_id
   AND m.sender_id != auth.uid()
   AND m.status = 'normal'
   AND (cm.last_read_at IS NULL OR m.created_at > cm.last_read_at)
  WHERE cm.user_id = auth.uid()
  GROUP BY m.conversation_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_conversation_unread_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_conversation_unread_counts() TO service_role;

-- 允许成员更新自己的 last_read_at（进入会话时标记已读）
DROP POLICY IF EXISTS "conversation_members_update_own" ON public.conversation_members;
CREATE POLICY "conversation_members_update_own" ON public.conversation_members
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
