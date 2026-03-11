-- 再次扩展字段，支持描述和分类的动态化
ALTER TABLE keep_alive ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE keep_alive ADD COLUMN IF NOT EXISTS category TEXT;

-- 更新初始数据的描述
UPDATE keep_alive SET 
  description = '每日签到以维持网络访问权限。',
  category = 'Access Protocol'
WHERE service = 'glados';

UPDATE keep_alive SET 
  description = '触发每日活跃信号，防止项目被暂停。',
  category = 'Database Maintenance'
WHERE service = 'supabase';
