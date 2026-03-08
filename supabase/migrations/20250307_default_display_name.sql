-- 新用户注册时随机分配默认昵称（20 个宝可梦名）；并给已有 display_name 为空的用户补全
-- 昵称列表：皮卡丘、妙蛙种子、妙蛙草、妙蛙花、小火龙、火恐龙、喷火龙、杰尼龟、卡咪龟、水箭龟、
-- 绿毛虫、铁甲蛹、巴大蝶、波波、比比鸟、大比鸟、小拉达、拉达、烈雀、大嘴雀

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

-- 为已有用户中 display_name 为空者随机分配一个默认昵称
UPDATE public.profiles
SET display_name = (
  (ARRAY[
    '皮卡丘','妙蛙种子','妙蛙草','妙蛙花','小火龙','火恐龙','喷火龙','杰尼龟','卡咪龟','水箭龟',
    '绿毛虫','铁甲蛹','巴大蝶','波波','比比鸟','大比鸟','小拉达','拉达','烈雀','大嘴雀'
  ])[1 + floor(random() * 20)::int]
)
WHERE display_name IS NULL OR trim(display_name) = '';
