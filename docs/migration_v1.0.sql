-- 扩展 keep_alive 表以支持动态配置
ALTER TABLE keep_alive ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE keep_alive ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'http';
ALTER TABLE keep_alive ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonB;
ALTER TABLE keep_alive ADD COLUMN IF NOT EXISTS rules JSONB DEFAULT '{}'::jsonB;
ALTER TABLE keep_alive ADD COLUMN IF NOT EXISTS notification_level TEXT DEFAULT 'failure-only';
ALTER TABLE keep_alive ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMPTZ;

-- 更新现有记录的默认名称
UPDATE keep_alive SET name = 'GLaDOS 签到' WHERE service = 'glados';
UPDATE keep_alive SET name = 'Supabase 保活' WHERE service = 'supabase';
UPDATE keep_alive SET name = service WHERE name IS NULL;

-- 注入 GLaDOS 配置
-- 注意：Cookie 将在运行时优先从环境变量 GLADOS_COOKIE 加载，或者从 config.headers.Cookie 加载
UPDATE keep_alive SET 
  type = 'http',
  config = '{
    "urls": ["https://glados.rocks/api/user/checkin", "https://glados.cloud/api/user/checkin"],
    "method": "POST",
    "headers": {"Content-Type": "application/json"},
    "body": "{\"token\": \"glados.cloud\"}"
  }'::jsonb,
  rules = '{
    "success": {
      "status": 200,
      "json": [{"path": "code", "operator": "in", "value": [0, 1]}]
    },
    "increment": {
      "json": [{"path": "code", "operator": "eq", "value": 0}]
    }
  }'::jsonb
WHERE service = 'glados';

-- 注入 Supabase 配置
UPDATE keep_alive SET 
  type = 'supabase_internal',
  config = '{}'::jsonb,
  rules = '{}'::jsonb
WHERE service = 'supabase';
