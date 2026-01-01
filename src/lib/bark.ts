import { env } from './env';

export async function sendBarkNotification(title: string, body: string, group?: string) {
  if (!env.bark?.deviceKey) {
    console.warn('BARK_DEVICE_KEY is not set, skipping notification');
    return;
  }

  const encodedTitle = encodeURIComponent(title);
  const encodedBody = encodeURIComponent(body);

  // 构建 URL，可选的 group 参数
  let url = `https://api.day.app/${env.bark.deviceKey}/${encodedTitle}/${encodedBody}`;
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
