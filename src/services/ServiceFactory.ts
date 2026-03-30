import { supabase } from '@/lib/supabase';
import type { ServiceConfig, DbServiceJoined, DbServiceStats } from '@/types';
import { DynamicService } from './DynamicService';

export class ServiceFactory {
  /**
   * 辅助方法：将数据库联表数据平铺为业务层的 ServiceConfig
   */
  private static flattenConfig(item: DbServiceJoined): ServiceConfig {
    const rawStats = item.service_stats;
    const stats = (Array.isArray(rawStats) ? rawStats[0] : rawStats) as DbServiceStats | undefined;

    const statsSafe = stats || {
      manual_count: 0,
      auto_count: 0,
      failure_count: 0,
      last_run_at: null,
      updated_at: '',
    };

    return {
      service: item.service,
      name: item.name,
      type: item.type,
      description: item.description,
      category: item.category,
      enabled: item.enabled,
      config: item.config,
      rules: item.rules,
      notification_level: item.notification_level,
      created_at: item.created_at,
      manual_count: statsSafe.manual_count,
      auto_count: statsSafe.auto_count,
      failure_count: statsSafe.failure_count,
      last_run_at: statsSafe.last_run_at || undefined,
      timestamp: statsSafe.updated_at || item.created_at,
    };
  }

  /**
   * 根据 ID 获取单个服务实例
   */
  static async getService(id: string): Promise<DynamicService | null> {
    const { data, error } = await supabase
      .from('service_configs')
      .select('*, service_stats(*)')
      .eq('service', id.toLowerCase())
      .single();

    if (error || !data) {
      return null;
    }

    return new DynamicService(this.flattenConfig(data as unknown as DbServiceJoined));
  }

  /**
   * 获取所有启用的服务实例
   */
  static async getAllEnabledServices(): Promise<DynamicService[]> {
    const { data, error } = await supabase
      .from('service_configs')
      .select('*, service_stats(*)')
      .eq('enabled', true);

    if (error || !data) {
      return [];
    }

    return (data as unknown as DbServiceJoined[]).map(
      item => new DynamicService(this.flattenConfig(item))
    );
  }
}
