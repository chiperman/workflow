-- 创建 keep_alive 表
-- 如果已有旧表，请先删除后再执行此脚本
CREATE TABLE IF NOT EXISTS keep_alive (
  service TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  manual_count INTEGER NOT NULL DEFAULT 0,
  auto_count INTEGER NOT NULL DEFAULT 0
);

-- 初始化服务记录
INSERT INTO keep_alive (service, timestamp, manual_count, auto_count)
VALUES 
  ('supabase', NOW(), 0, 0),
  ('glados', NOW(), 0, 0)
ON CONFLICT (service) DO NOTHING;
