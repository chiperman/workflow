import type { SystemStatus } from '@/types';

interface SystemStatusProps {
    status: SystemStatus;
}

/**
 * 系统状态显示组件
 * 
 * 显示系统整体状态（Operational/Degraded/Checking）
 */
export function SystemStatusBadge({ status }: SystemStatusProps) {
    const getStatusStyles = () => {
        switch (status) {
            case 'Operational':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'Degraded':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Checking':
                return 'bg-gray-100 text-gray-600 border-gray-200';
            default:
                return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${getStatusStyles()}`}>
            <div className={`w-2 h-2 rounded-full ${status === 'Operational' ? 'bg-green-500' :
                    status === 'Degraded' ? 'bg-yellow-500' :
                        'bg-gray-400'
                }`} />
            {status}
        </div>
    );
}
