import type { ServiceStatus, SystemStatus } from '@/types';
import Image from 'next/image';

interface FooterProps {
  version: string;
  systemStatus: SystemStatus;
  failingServices: string[];
  serviceStatuses?: {
    supabase: ServiceStatus;
    leancloud: ServiceStatus;
  };
}

export function Footer({ version, systemStatus, failingServices, serviceStatuses }: FooterProps) {
  const getStatusColor = (status: ServiceStatus | undefined) => {
    if (!status || status === 'unknown') return 'bg-gray-400';
    if (status === 'operational') return 'bg-emerald-500';
    return 'bg-red-500'; // misconfigured, outage
  };

  return (
    <footer className="mt-8 pt-6 border-t border-[#e5e5e0] flex flex-col md:flex-row items-center justify-between text-xs text-[#888888] tracking-widest uppercase gap-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span
              title="Supabase"
              className={`w-2 h-2 rounded-full ${
                serviceStatuses
                  ? getStatusColor(serviceStatuses.supabase)
                  : systemStatus === 'Operational'
                    ? 'bg-emerald-500'
                    : systemStatus === 'Checking'
                      ? 'bg-gray-400 animate-pulse'
                      : 'bg-amber-500'
              }`}
            ></span>
            <span
              title="LeanCloud"
              className={`w-2 h-2 rounded-full ${
                serviceStatuses
                  ? getStatusColor(serviceStatuses.leancloud)
                  : systemStatus === 'Operational'
                    ? 'bg-emerald-500'
                    : systemStatus === 'Checking'
                      ? 'bg-gray-400 animate-pulse'
                      : 'bg-amber-500'
              }`}
            ></span>
          </div>
          <div className="flex gap-1">
            <span className="font-semibold">Status: {systemStatus}</span>
            {failingServices.length > 0 && (
              <span className="text-red-500 font-bold">
                ({failingServices.join(', ')} Unhealthy)
              </span>
            )}
          </div>
        </div>
        <p>Workflow {version} • Antigravity</p>
      </div>

      <div className="flex flex-col items-center md:items-end gap-3">
        <span className="text-[10px] text-[#a0a09a]">Powered By</span>
        <div className="flex items-center gap-6">
          <a
            href="https://nextjs.org"
            target="_blank"
            rel="noopener noreferrer"
            title="Vercel"
            className="opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300"
          >
            <Image
              src="/vercel.svg"
              alt="Vercel"
              width={1155}
              height={1000}
              className="h-4 w-auto invert"
              priority
            />
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub"
            className="opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300"
          >
            <Image src="/github.svg" alt="GitHub" width={20} height={20} className="h-5 w-auto" />
          </a>
          <a
            href="https://deepmind.google/technologies/gemini/"
            target="_blank"
            rel="noopener noreferrer"
            title="Gemini"
            className="opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300"
          >
            <Image
              src="/gemini-color.svg"
              alt="Gemini"
              width={20}
              height={20}
              className="h-5 w-auto"
            />
          </a>
          <a
            href="https://claude.ai"
            target="_blank"
            rel="noopener noreferrer"
            title="Claude"
            className="opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300"
          >
            <Image
              src="/claude-color.svg"
              alt="Claude"
              width={20}
              height={20}
              className="h-5 w-auto"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
