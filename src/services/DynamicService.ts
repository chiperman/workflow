import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { getBeijingTime } from '@/lib/utils';
import { ServiceExecutor } from '@/lib/ServiceExecutor';
import type { KeepAliveResult, ServiceConfig, ValidationRules } from '@/types';
import { BaseService } from './BaseService';

export class DynamicService extends BaseService {
  public readonly fullConfig: ServiceConfig;

  constructor(config: ServiceConfig) {
    super(config.service);
    this.fullConfig = config;
    this.notificationLevel = config.notification_level;
  }

  public get type(): string {
    return this.fullConfig.type;
  }

  public get displayName(): string {
    return this.fullConfig.name || this.serviceName;
  }

  public get description(): string | undefined {
    return this.fullConfig.description;
  }

  public get category(): string | undefined {
    return this.fullConfig.category;
  }

  /**
   * 核心执行逻辑
   */
  protected async executeKeepAlive(trigger: 'auto' | 'manual' = 'auto'): Promise<KeepAliveResult> {
    try {
      if (this.fullConfig.type === 'supabase_internal') {
        return await this.executeSupabaseInternal(trigger);
      }

      return await this.executeHttpRequest(trigger);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[${this.serviceName}] executeKeepAlive error:`, errorMessage);
      return { success: false, message: errorMessage, duration: 0, error: errorMessage };
    }
  }

  /**
   * 执行 Supabase 内部保活（仅更新统计信息）
   */
  private async executeSupabaseInternal(trigger: 'auto' | 'manual'): Promise<KeepAliveResult> {
    logger.info(`[${this.serviceName}] Executing internal keep-alive...`);
    const updateResult = await this.updateServiceStats(true, trigger);
    if (!updateResult.ok) {
      throw new Error(updateResult.error);
    }
    const { action, data: stats } = updateResult.data;
    const beijingTime = getBeijingTime();
    const message = `${this.fullConfig.name} 成功: ${
      action === 'created' ? '创建记录' : '更新记录'
    } 于 ${beijingTime} (${trigger})`;

    return {
      success: true,
      action,
      message,
      duration: 0,
      data: stats,
    };
  }

  /**
   * 执行通用 HTTP 请求
   */
  protected async executeHttpRequest(trigger: 'auto' | 'manual'): Promise<KeepAliveResult> {
    const { config, rules } = this.fullConfig;
    const urls = config.urls || (config.url ? [config.url] : []);

    if (urls.length === 0) {
      throw new Error('No URL configured for HTTP service');
    }

    let lastError: Error | null = null;
    let responseData: unknown = null;
    let responseStatus = 0;

    // 遍历 URL (多 URL 轮询逻辑，模仿 GLaDOS)
    for (const url of urls) {
      try {
        logger.info(`[${this.serviceName}] Trying API: ${url}`);

        const headers: Record<string, string> = { ...config.headers };

        // 特殊处理 GLaDOS Cookie 注入 (保持向后兼容)
        if (
          this.serviceName.toLowerCase() === 'glados' &&
          !headers['Cookie'] &&
          env.glados.cookie
        ) {
          headers['Cookie'] = env.glados.cookie;
        }

        const response = await fetch(url, {
          method: config.method || 'GET',
          headers,
          body: config.body ? config.body : undefined,
          signal: AbortSignal.timeout(config.timeout || 10000),
        });

        responseStatus = response.status;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }

        // 校验成功规则
        const isSuccess = this.validateRules(responseStatus, responseData, rules.success);
        if (isSuccess) {
          lastError = null;
          break;
        } else {
          throw new Error(`Validation failed. Status: ${responseStatus}`);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        const isTimeout =
          lastError.name === 'TimeoutError' || lastError.message.includes('timeout');
        const errorType = isTimeout ? 'Timeout' : 'Network/Request Error';

        logger.warn(`[${this.serviceName}] API ${url} failed (${errorType}):`, lastError.message);
        continue;
      }
    }

    if (lastError) {
      return {
        success: false,
        message: `${this.fullConfig.name} 所有配置节点请求均失败。最后错误: ${lastError.message}`,
        duration: 0,
        error: lastError.message,
      };
    }

    // 校验是否需要增加统计计数
    const shouldIncrement = this.validateRules(responseStatus, responseData, rules.increment);
    const updateResult = await this.updateServiceStats(shouldIncrement, trigger);

    if (!updateResult.ok) {
      throw new Error(updateResult.error);
    }

    const { action, data: stats } = updateResult.data;
    const beijingTime = getBeijingTime();

    // 构造返回消息
    let message = `${this.fullConfig.name} 成功: 于 ${beijingTime} (${trigger})`;
    if (typeof responseData === 'object' && responseData && 'message' in responseData) {
      message = `${this.fullConfig.name}: "${String((responseData as Record<string, unknown>).message)}" [${beijingTime}]`;
    }

    return {
      success: true,
      action,
      message,
      duration: 0,
      data: stats,
      // 如果不需要增加计数，通常意味着是“重复签到”之类的场景，我们可以选择跳过日志
      skipLog: !shouldIncrement && this.serviceName.toLowerCase() === 'glados',
    };
  }

  /**
   * 规则校验逻辑
   */
  private validateRules(status: number, data: unknown, rules?: ValidationRules): boolean {
    if (!rules) return true;

    // 1. 智能匹配模式 (Smart Matching)
    // 自动扫描返回内容中的常见成功标志
    if (rules.smart_matching) {
      // 只要状态码是 2xx 且内容中没有明显的错误词，或者包含明显的成功词
      const isStatusOk = status >= 200 && status < 300;
      const contentStr = JSON.stringify(data).toLowerCase();

      const successWords = ['success', 'ok', 'true', '0', '成功', '完成'];
      const failureWords = ['error', 'fail', 'invalid', 'expired', '失败', '错误'];

      const hasSuccess = successWords.some(w => contentStr.includes(w));
      const hasFailure = failureWords.some(w => contentStr.includes(w));

      // 判定逻辑：状态码OK 且 (有成功词 或 没有失败词)
      if (isStatusOk && (hasSuccess || !hasFailure)) {
        return true;
      }
      // 如果没通过智能判断，则继续走下方的常规校验
    }

    // 2. 状态码校验 (显式配置优先级最高)
    if (rules.status !== undefined && status !== rules.status) {
      return false;
    }

    // 3. JSON/数据 校验
    if (rules.json && rules.json.length > 0) {
      for (const entry of rules.json) {
        const actualValue = this.getValueByPath(data, entry.path);
        if (!this.compareValues(actualValue, entry.operator, entry.value)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 简单的路径取值逻辑 (a.b.c)
   */
  private getValueByPath(obj: unknown, path: string): unknown {
    const MAX_DEPTH = 10;
    if (!path || !obj || typeof obj !== 'object') return obj;
    const keys = path.split('.');
    if (keys.length > MAX_DEPTH) {
      logger.warn(
        `[${this.serviceName}] Path depth exceeded maximum limit (${MAX_DEPTH}): ${path}`
      );
      return undefined;
    }
    let current: unknown = obj;
    for (const key of keys) {
      if (current === null || typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[key];
    }
    return current;
  }

  /**
   * 简单的值比较逻辑
   */
  private compareValues(actual: unknown, operator: string, expected: unknown): boolean {
    switch (operator) {
      case 'eq':
        return actual === expected;
      case 'neq':
        return actual !== expected;
      case 'gt':
        return (actual as number) > (expected as number);
      case 'lt':
        return (actual as number) < (expected as number);
      case 'in':
        return Array.isArray(expected) && expected.includes(actual);
      case 'contains':
        return typeof actual === 'string' && actual.includes(expected as string);
      default:
        return false;
    }
  }

  /**
   * 暴露给外部的运行方法
   */
  public async run(trigger: 'auto' | 'manual' = 'auto'): Promise<KeepAliveResult> {
    const result = await ServiceExecutor.runService(this, trigger);

    // 运行结束后更新最后运行时间 (异步执行，不等待)
    if (result.success) {
      supabase
        .from('keep_alive')
        .update({ last_run_at: new Date().toISOString() })
        .eq('service', this.serviceName.toLowerCase())
        .then(({ error }) => {
          if (error)
            logger.warn(`[${this.serviceName}] Failed to update last_run_at:`, error.message);
        });
    }

    return result;
  }
}
