'use client';

import { Switch as SwitchPrimitive } from '@base-ui/react/switch';
import { cn } from '@/lib/utils';

function Switch({
  className,
  size = 'default',
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: 'sm' | 'default';
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        'peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:ring-destructive/20',
        'data-[size=default]:h-5 data-[size=default]:w-9 data-[size=sm]:h-4 data-[size=sm]:w-7',
        'data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-input',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none block rounded-full bg-background shadow-sm ring-0 transition-transform duration-200 ease-out',
          'group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3',
          'group-data-[state=checked]/switch:translate-x-[calc(100%-2px)] group-data-[state=unchecked]/switch:translate-x-0.5'
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
