import { supabase } from './supabase';
import { sendBarkNotification } from './bark';

export async function runKeepAlive() {
    const start = Date.now();
    try {
        // Fetch up to 10 users to check if we have multiple
        const { data: { users }, error: authError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 10 });

        if (authError) {
            throw authError;
        }

        const duration = Date.now() - start;

        let userInfo = 'No users found';
        if (users.length > 1) {
            userInfo = `User Count: ${users.length}`;
        } else if (users.length === 1) {
            userInfo = `User: ${users[0].email}`;
        }

        const message = `Supabase Keep-Alive Success: ${userInfo}. Duration: ${duration}ms.`;
        console.log(message);
        await sendBarkNotification('✅ Supabase Keep-Alive Success', message, 'Supabase-Success');
        return { success: true, message, data: users };
    } catch (error: any) {
        const duration = Date.now() - start;
        const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
        const message = `❌ Supabase Keep-Alive Failed\n• Error: ${error.message}\n• Duration: ${duration}ms\n• Time: ${timestamp}`;
        console.error(message.replace(/\n/g, ' | '));
        await sendBarkNotification('❌ Supabase Keep-Alive Failed', message, 'Supabase-Failed');
        return { success: false, message, error: error.message };
    }
}
