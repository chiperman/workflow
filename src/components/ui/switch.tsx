'use client';

import { Switch as SwitchPrimitive } from '@base-ui/react/switch';
import { cn } from '@/lib/utils';

interface SwitchProps extends SwitchPrimitive.Root.Props {
  size?: 'sm' | 'default';
}

function Switch({ className, size = 'default', checked, ...props }: SwitchProps) {
  const isSmall = size === 'sm';
  const isChecked = !!checked;

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      checked={checked}
      className={cn(
        'peer relative inline-flex shrink-0 items-center rounded-full border-2 border-transparent transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-[#191919]/20 focus-visible:ring-offset-2',
        // 开启和关闭的背景色直接由 JavaScript 逻辑控制，保证生效
        isChecked
          ? 'bg-[#191919] shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]'
          : 'bg-[#e5e5e0] shadow-inner',
        'cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
        isSmall ? 'h-5 w-9' : 'h-6 w-11',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none block rounded-full bg-white shadow-md ring-0 transition-transform duration-300 ease-in-out',
          // 滑块位移同样直接由 JavaScript 逻辑控制
          isSmall
            ? isChecked
              ? 'size-4 translate-x-4'
              : 'size-4 translate-x-0'
            : isChecked
              ? 'size-5 translate-x-5'
              : 'size-5 translate-x-0'
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
