import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { getBeijingDateString } from '@/lib/utils';
import type { KeepAliveResult, Result, DbServiceConfig } from '@/types';

export type NotificationLevel = 'always' | 'failure-only' | 'none';

export abstract class BaseService {
  /**
   * 通知策略：
   * always: 每次运行都发送通知
   * failure-only: 仅在失败时发送通知
   * none: 绝不发送成功通知（失败通知仍可根据逻辑保留）
   */
  protected notificationLevel: NotificationLevel = 'always';
  protected notificationKey?: string;

  constructor(protected serviceName: string) {}

  /** 公共只读属性，供外部获取服务标识（小写） */
  public get name(): string {
    return this.serviceName;
  }

  public get notifyLevel(): NotificationLevel {
    return this.notificationLevel;
  }

  public get notifyKey(): string | undefined {
    return this.notificationKey;
  }

  /**
   * 核心保活逻辑，由子类实现
   */
  protected abstract executeKeepAlive(trigger: 'auto' | 'manual'): Promise<KeepAliveResult>;

  /**
   * 公共执行入口，调用 protected executeKeepAlive 供 ServiceExecutor 等外部模块使用
   */
  public async runKeepAlive(trigger: 'auto' | 'manual'): Promise<KeepAliveResult> {
    return this.executeKeepAlive(trigger);
  }

  /**
   * 获取服务状态（默认实现，从 Supabase 查询）
   * 子类可直接继承此实现，或覆写以使用自定义逻辑
   */
  public async getStats(): Promise<
    Result<{
      manual_count: number;
      auto_count: number;
      failure_count: number;
      enabled: boolean;
      tableExists: boolean;
    }>
  > {
    try {
      const serviceKey = this.serviceName.toLowerCase();

      // 使用 JOIN 联合查询配置和统计
      const { data: existing, error } = await supabase
        .from('service_stats')
        .select(
          `
          manual_count, 
          auto_count, 
          failure_count,
          configs:service_configs(enabled)
        `
        )
        .eq('service', serviceKey)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // 如果没有统计记录，尝试只查询配置表获取 enabled 状态
          const { data: configData } = await supabase
            .from('service_configs')
            .select('enabled')
            .eq('service', serviceKey)
            .single();

          return {
            ok: true,
            data: {
              manual_count: 0,
              auto_count: 0,
              failure_count: 0,
              enabled: configData?.enabled ?? true,
              tableExists: true,
            },
          };
        }
        if (error.code === '42P01') {
          return {
            ok: false,
            error: "Table 'service_stats' does not exist",
          };
        }
        throw error;
      }

      // 使用强类型接口处理嵌套的 JOIN 数据
      const row = existing as unknown as { configs: DbServiceConfig | DbServiceConfig[] };
      const configs = row.configs;
      const configItem = Array.isArray(configs) ? configs[0] : configs;
      const enabledFinal = configItem?.enabled ?? true;

      return {
        ok: true,
        data: {
          manual_count: existing?.manual_count || 0,
          auto_count: existing?.auto_count || 0,
          failure_count: existing?.failure_count || 0,
          enabled: enabledFinal,
          tableExists: true,
        },
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[${this.serviceName}] getStats error:`, errorMessage);
      return { ok: false, error: errorMessage };
    }
  }

  /**
   * 记录签到日志到 keep_alive_logs 表
   * 此方法设计为"尽力而为"，失败不影响主逻辑
   */
  public async logKeepAliveResult(result: KeepAliveResult): Promise<void> {
    // 如果结果标记为跳过日志（如重复签到），直接返回
    if (result.skipLog) {
      logger.info(`[${this.serviceName}] Skipping log (skipLog=true).`);
      return;
    }

    try {
      const serviceKey = this.serviceName.toLowerCase();

      // 检查今天是否已经有相同的执行结果记录 (如果是成功则仅查成功，如果是失败则查相同消息的记录)
      const todayStr = getBeijingDateString();
      const todayStart = new Date(`${todayStr}T00:00:00.000+08:00`).toISOString();

      let query = supabase
        .from('keep_alive_logs')
        .select('*', { count: 'exact', head: true })
        .eq('service', serviceKey)
        .gte('timestamp', todayStart);

      if (result.success) {
        // 对于成功：今天只要成功过就不再记录
        query = query.eq('status', 'success');
      } else {
        // 对于失败：今天已经记录过该特定错误就不再记录
        query = query.eq('status', 'failure').eq('message', result.message);
      }

      const { count } = await query;

      if (count && count > 0) {
        logger.info(
          `[${this.serviceName}] Skipping duplicate log (already ${
            result.success ? 'succeeded' : 'recorded this error'
          } today).`
        );
        return;
      }

      const { error } = await supabase.from('keep_alive_logs').insert({
        service: serviceKey,
        status: result.success ? 'success' : 'failure',
        message: result.message,
        duration: result.duration,
      });

      if (error) {
        logger.warn(`[${this.serviceName}] Failed to log keep-alive result:`, error.message);
      }
    } catch (err) {
      // 静默失败，不影响主流程
      logger.warn(
        `[${this.serviceName}] Exception while logging:`,
        err instanceof Error ? err.message : 'Unknown error'
      );
    }
  }

  /**
   * 更新服务的统计信息 (Generic implementation)
   * 提取了 GladosService 和 SupabaseService 中的公共逻辑
   */
  protected async updateServiceStats(
    shouldIncrement: boolean,
    trigger: 'auto' | 'manual'
  ): Promise<
    Result<{
      action: 'created' | 'updated';
      data: { manual_count: number; auto_count: number; failure_count: number };
    }>
  > {
    const serviceKey = this.serviceName.toLowerCase();

    // 1. Select existing record
    const { data: existing, error: fetchError } = await supabase
      .from('service_stats')
      .select('*')
      .eq('service', serviceKey)
      .single();

    if (fetchError) {
      if (fetchError.code === '42P01') {
        return {
          ok: false,
          error: "Table 'service_stats' does not exist. Please execute the SQL setup.",
        };
      }
      if (fetchError.code !== 'PGRST116') {
        logger.error(`[${this.serviceName}] Supabase select error:`, fetchError);
        return { ok: false, error: `Supabase select failed: ${fetchError.message}` };
      }
    }

    // 2. Calculate new counts
    let manualCount = existing?.manual_count || 0;
    let autoCount = existing?.auto_count || 0;

    if (shouldIncrement) {
      if (trigger === 'manual') manualCount++;
      else autoCount++;
    }

    // 3. Upsert record
    const { error: upsertError } = await supabase
      .from('service_stats')
      .upsert({
        service: serviceKey,
        updated_at: new Date().toISOString(),
        manual_count: manualCount,
        auto_count: autoCount,
        failure_count: existing?.failure_count || 0,
      })
      .select()
      .single();

    if (upsertError) {
      logger.error(`[${this.serviceName}] Supabase upsert error:`, upsertError);
      return { ok: false, error: `Supabase upsert failed: ${upsertError.message}` };
    }

    return {
      ok: true,
      data: {
        action: existing ? 'updated' : 'created',
        data: {
          manual_count: manualCount,
          auto_count: autoCount,
          failure_count: existing?.failure_count || 0,
        },
      },
    };
  }
}
