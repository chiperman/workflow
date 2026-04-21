ALTER TABLE public.service_configs
ADD COLUMN IF NOT EXISTS secret_config JSONB DEFAULT '{}'::jsonb;
