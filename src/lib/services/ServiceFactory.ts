import { supabase } from '@/lib/supabase';
import type { ServiceConfig } from '@/types';
import { DynamicService } from './DynamicService';

export class ServiceFactory {
  /**
   * 根据 ID 获取单个服务实例
   */
  static async getService(id: string): Promise<DynamicService | null> {
    const { data, error } = await supabase
      .from('keep_alive')
      .select('*')
      .eq('service', id.toLowerCase())
      .single();

    if (error || !data) {
      return null;
    }

    return new DynamicService(data as ServiceConfig);
  }

  /**
   * 获取所有启用的服务实例
   */
  static async getAllEnabledServices(): Promise<DynamicService[]> {
    const { data, error } = await supabase.from('keep_alive').select('*').eq('enabled', true);

    if (error || !data) {
      return [];
    }

    return data.map((config: unknown) => new DynamicService(config as ServiceConfig));
  }
}
