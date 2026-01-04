-- 创建 keep_alive 表
-- 用于存储所有服务的保活状态和开关配置
-- 注意：记录会在首次 Run Task 时自动创建，此初始化为可选

CREATE TABLE IF NOT EXISTS keep_alive (
  service TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  manual_count INTEGER NOT NULL DEFAULT 0,
  auto_count INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT TRUE
);

-- 可选：预初始化服务记录（如需在首次运行前使用开关功能）
INSERT INTO keep_alive (service, timestamp, manual_count, auto_count, enabled)
VALUES 
  ('supabase', NOW(), 0, 0, TRUE),
  ('leancloud', NOW(), 0, 0, TRUE),
  ('glados', NOW(), 0, 0, TRUE)
ON CONFLICT (service) DO NOTHING;

-- 启用行级安全策略 (RLS)
ALTER TABLE keep_alive ENABLE ROW LEVEL SECURITY;
