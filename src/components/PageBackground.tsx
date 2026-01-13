'use client';

import { motion } from 'framer-motion';

export function PageBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-[#fdfcf8]">
      {/* Subtle Aurora Layer 1 - Mint */}
      <motion.div
        animate={{
          x: [0, 80, 0],
          y: [0, 40, 0],
          scale: [1, 1.2, 1],
          opacity: [0.02, 0.05, 0.02],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-[5%] left-[5%] w-[60%] h-[60%] bg-[#3f6212] blur-[140px] rounded-full mix-blend-multiply"
      />

      {/* Subtle Aurora Layer 2 - Terracotta/Soft Orange */}
      <motion.div
        animate={{
          x: [0, -60, 0],
          y: [0, 30, 0],
          scale: [1, 1.3, 1],
          opacity: [0.03, 0.06, 0.03],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-[5%] right-[5%] w-[70%] h-[70%] bg-[#d97757] blur-[160px] rounded-full mix-blend-multiply"
      />

      {/* Grain/Noise Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] blend-overlay" />
    </div>
  );
}
