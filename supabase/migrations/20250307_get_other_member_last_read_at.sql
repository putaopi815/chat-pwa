-- 返回当前会话中「对方」成员的 last_read_at，用于己方消息的已读图标
-- RLS 仅允许查自己的 conversation_members 行，故用 SECURITY DEFINER 代为读取对方行
CREATE OR REPLACE FUNCTION public.get_other_member_last_read_at(conv_id UUID)
RETURNS TIMESTAMPTZ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  me_id UUID := auth.uid();
  out_at TIMESTAMPTZ;
BEGIN
  IF me_id IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT m.last_read_at INTO out_at
  FROM public.conversation_members m
  WHERE m.conversation_id = conv_id
    AND m.user_id != me_id
  LIMIT 1;
  RETURN out_at;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_other_member_last_read_at(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_other_member_last_read_at(UUID) TO service_role;
