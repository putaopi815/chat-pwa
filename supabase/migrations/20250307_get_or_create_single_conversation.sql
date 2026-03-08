-- 根据对方 user_id 查找已有单聊或创建新单聊，返回 conversation_id（服务端可查所有 members，不受 RLS 限制）
CREATE OR REPLACE FUNCTION public.get_or_create_single_conversation(other_user_id UUID)
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

  -- 查找已有会话：存在仅包含 me 与 other 两人的会话
  SELECT c.id INTO conv_id
  FROM public.conversations c
  WHERE EXISTS (
    SELECT 1 FROM public.conversation_members m
    WHERE m.conversation_id = c.id AND m.user_id = me_id
  )
  AND EXISTS (
    SELECT 1 FROM public.conversation_members m
    WHERE m.conversation_id = c.id AND m.user_id = other_user_id
  )
  AND (SELECT COUNT(*) FROM public.conversation_members m WHERE m.conversation_id = c.id) = 2
  LIMIT 1;

  IF conv_id IS NOT NULL THEN
    RETURN conv_id;
  END IF;

  -- 不存在则创建
  INSERT INTO public.conversations DEFAULT VALUES RETURNING id INTO conv_id;
  INSERT INTO public.conversation_members (conversation_id, user_id)
  VALUES (conv_id, me_id), (conv_id, other_user_id);
  RETURN conv_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_single_conversation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_single_conversation(UUID) TO service_role;
