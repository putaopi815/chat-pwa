-- 1. conversations 增加最后一条消息摘要与时间（供列表展示与同步）
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS last_message_preview TEXT,
  ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;

COMMENT ON COLUMN public.conversations.last_message_preview IS '最后一条消息摘要（正常/撤回/已清空）';
COMMENT ON COLUMN public.conversations.last_message_at IS '最后一条消息时间';

-- 2. messages.status 支持 purged_for_all（整会话清空后的占位状态）
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_status_check;
ALTER TABLE public.messages
  ADD CONSTRAINT messages_status_check
  CHECK (status IN ('normal', 'recalled', 'purged_for_all'));

-- 3. RLS：会话成员可将该会话下任意消息更新为 purged_for_all（清空双方记录）
CREATE POLICY "messages_update_purge_for_member" ON public.messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_members m
      WHERE m.conversation_id = messages.conversation_id AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (status = 'purged_for_all');
