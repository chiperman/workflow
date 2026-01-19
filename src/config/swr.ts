import { SWRConfiguration } from 'swr';

/**
 * 默认 SWR 配置
 * 适用于大多数只读数据获取场景
 */
export const SWR_CONFIG: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  revalidateIfStale: false,
};
