import type { SystemStatus } from '@/types';

interface FooterProps {
    version: string;
    systemStatus: SystemStatus;
    failingServices: string[];
}

export function Footer({ version, systemStatus, failingServices }: FooterProps) {
    return (
        <footer className="mt-8 pt-6 border-t border-[#e5e5e0] flex flex-col md:flex-row items-center justify-between text-xs text-[#888888] tracking-widest uppercase gap-4">
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                        systemStatus === 'Operational' ? 'bg-emerald-500' :
                        systemStatus === 'Checking' ? 'bg-gray-400 animate-pulse' : 'bg-amber-500'
                    }`}></span>
                    <div className="flex gap-1">
                        <span className="font-semibold">Status: {systemStatus}</span>
                        {failingServices.length > 0 && (
                            <span className="text-amber-600">
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
                        <img src="/vercel.svg" alt="Vercel" className="h-4 w-auto invert" />
                    </a>
                    <a 
                        href="https://github.com" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        title="GitHub" 
                        className="opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                    >
                        <img src="/github.svg" alt="GitHub" className="h-5 w-auto" />
                    </a>
                    <a 
                        href="https://deepmind.google/technologies/gemini/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        title="Gemini" 
                        className="opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                    >
                        <img src="/gemini-color.svg" alt="Gemini" className="h-5 w-auto" />
                    </a>
                    <a 
                        href="https://claude.ai" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        title="Claude" 
                        className="opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                    >
                        <img src="/claude-color.svg" alt="Claude" className="h-5 w-auto" />
                    </a>
                </div>
            </div>
        </footer>
    );
}
