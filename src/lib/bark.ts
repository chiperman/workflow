import { env } from './env';

/**
 * 发送 Bark 通知
 * @param title 标题
 * @param body 内容
 * @param group 分组
 * @param customKey 可选的自定义 Device Key (任务级别配置)
 */
export async function sendBarkNotification(
  title: string,
  body: string,
  group?: string,
  customKey?: string
) {
  // 优先级：任务级别 customKey > 全局环境变量 env.bark.deviceKey
  const activeKey = customKey || env.bark?.deviceKey;

  if (!activeKey) {
    console.warn(
      'Bark device key is not provided (neither custom nor global), skipping notification'
    );
    return;
  }

  const encodedTitle = encodeURIComponent(title);
  const encodedBody = encodeURIComponent(body);

  // 构建 URL，可选的 group 参数
  let url = `https://api.day.app/${activeKey}/${encodedTitle}/${encodedBody}`;
  if (group) {
    url += `?group=${encodeURIComponent(group)}`;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error('Failed to send Bark notification:', await res.text());
    }
  } catch (error) {
    console.error('Error sending Bark notification:', error);
  }
}
