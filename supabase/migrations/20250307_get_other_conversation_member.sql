-- 根据会话 id 返回「对方」成员 user_id（当前用户必须是该会话成员）
-- SECURITY DEFINER 可读 conversation_members，不受 RLS 限制
CREATE OR REPLACE FUNCTION public.get_other_conversation_member(conv_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  me_id UUID := auth.uid();
  other_id UUID;
BEGIN
  IF me_id IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT m.user_id INTO other_id
  FROM public.conversation_members m
  WHERE m.conversation_id = conv_id
    AND m.user_id != me_id
  LIMIT 1;
  RETURN other_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_other_conversation_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_other_conversation_member(UUID) TO service_role;
