import { logger } from '@/lib/logger';
import { supabase as defaultSupabase } from '@/lib/supabase';
import { getBeijingTime } from '@/lib/utils';
import { ServiceExecutor } from '@/lib/ServiceExecutor';
import type { KeepAliveResult, ServiceConfig, ValidationRules } from '@/types';
import { BaseService } from './BaseService';
import { createClient } from '@supabase/supabase-js';

export class DynamicService extends BaseService {
  public readonly fullConfig: ServiceConfig;

  constructor(config: ServiceConfig) {
    super(config.service);
    this.fullConfig = config;
    this.notificationLevel = config.notification_level;
    this.notificationKey = config.config?.notification_key;
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
   * 暴露给外部的测试执行方法（不更新统计，不记录日志）
   */
  public async testExecution(): Promise<KeepAliveResult> {
    const result = await this.performAction('manual');
    return result;
  }

  /**
   * 核心执行逻辑
   */
  protected async executeKeepAlive(trigger: 'auto' | 'manual' = 'auto'): Promise<KeepAliveResult> {
    try {
      const result = await this.performAction(trigger);

      if (!result.success) {
        return result;
      }

      // 只有成功执行后，才更新统计信息
      const shouldIncrement = result.shouldIncrement ?? true;
      const updateResult = await this.updateServiceStats(shouldIncrement, trigger);

      if (!updateResult.ok) {
        throw new Error(updateResult.error);
      }

      const { action, data: stats } = updateResult.data;
      return {
        ...result,
        action,
        data: stats,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[${this.serviceName}] executeKeepAlive error:`, errorMessage);
      return { success: false, message: errorMessage, duration: 0, error: errorMessage };
    }
  }

  /**
   * 根据类型执行具体的动作 (不包含统计更新)
   */
  private async performAction(
    trigger: 'auto' | 'manual'
  ): Promise<KeepAliveResult & { shouldIncrement?: boolean }> {
    if (this.fullConfig.type === 'supabase_internal') {
      return await this.performSupabaseInternal(trigger);
    }
    return await this.performHttpRequest(trigger);
  }

  /**
   * 执行 Supabase 内部逻辑
   */
  private async performSupabaseInternal(
    trigger: 'auto' | 'manual'
  ): Promise<KeepAliveResult & { shouldIncrement?: boolean }> {
    const { config } = this.fullConfig;
    const isRemote = !!(config.supabase_url && config.supabase_key);
    const targetUrl = config.supabase_url || 'Current Project';

    logger.info(`[${this.serviceName}] Executing Supabase keep-alive on: ${targetUrl}...`);

    try {
      if (isRemote) {
        const remoteClient = createClient(config.supabase_url!, config.supabase_key!);
        const targetTable = config.table_name || 'keep_alive';

        const { error } = await remoteClient
          .from(targetTable)
          .select('count', { count: 'exact', head: true })
          .limit(1);

        if (error) {
          throw new Error(`Remote Supabase check failed: ${error.message}`);
        }
        logger.info(`[${this.serviceName}] Remote Supabase check successful.`);
      }

      const beijingTime = getBeijingTime();
      const message = `${this.fullConfig.name} 成功: ${
        isRemote ? '已触发远程保活' : '本地保活触发'
      } 于 ${beijingTime} (${trigger})`;

      return {
        success: true,
        message,
        duration: 0,
        shouldIncrement: true,
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown Supabase error';
      logger.error(`[${this.serviceName}] performSupabaseInternal error:`, msg);
      return { success: false, message: msg, duration: 0, error: msg };
    }
  }

  /**
   * 执行 HTTP 请求逻辑
   */
  private async performHttpRequest(
    trigger: 'auto' | 'manual'
  ): Promise<KeepAliveResult & { shouldIncrement?: boolean }> {
    const { config, rules } = this.fullConfig;
    const urls = config.urls || (config.url ? [config.url] : []);

    if (urls.length === 0) {
      throw new Error('No URL configured for HTTP service');
    }

    let lastError: Error | null = null;
    let responseData: unknown = null;
    let responseStatus = 0;

    for (const url of urls) {
      try {
        logger.info(`[${this.serviceName}] Trying API: ${url}`);
        const headers: Record<string, string> = { ...config.headers };
        if (config.cookie) {
          headers['Cookie'] = config.cookie;
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

        const isSuccess = this.validateRules(responseStatus, responseData, rules.success);
        if (isSuccess) {
          lastError = null;
          break;
        } else {
          const responseSnippet =
            typeof responseData === 'object'
              ? JSON.stringify(responseData).substring(0, 100)
              : String(responseData).substring(0, 100);
          throw new Error(`Validation failed. Status: ${responseStatus}. Data: ${responseSnippet}`);
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        logger.warn(`[${this.serviceName}] API ${url} failed:`, lastError.message);
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

    const shouldIncrement = this.validateRules(responseStatus, responseData, rules.increment);
    const beijingTime = getBeijingTime();
    let message = `${this.fullConfig.name} 成功: 于 ${beijingTime} (${trigger})`;
    if (typeof responseData === 'object' && responseData && 'message' in responseData) {
      message = `${this.fullConfig.name}: "${String((responseData as Record<string, unknown>).message)}" [${beijingTime}]`;
    }

    return {
      success: true,
      message,
      duration: 0,
      rawResponse: responseData, // 这里的 rawResponse 供测试页面显示原始响应内容
      shouldIncrement,
      skipLog: !shouldIncrement,
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
      defaultSupabase
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
