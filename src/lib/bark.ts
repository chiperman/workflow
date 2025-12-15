export async function sendBarkNotification(title: string, body: string) {
    const barkKey = process.env.BARK_DEVICE_KEY;
    if (!barkKey) {
        console.warn('BARK_DEVICE_KEY is not set, skipping notification');
        return;
    }

    const encodedTitle = encodeURIComponent(title);
    const encodedBody = encodeURIComponent(body);
    const url = `https://api.day.app/${barkKey}/${encodedTitle}/${encodedBody}`;

    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.error('Failed to send Bark notification:', await res.text());
        }
    } catch (error) {
        console.error('Error sending Bark notification:', error);
    }
}
