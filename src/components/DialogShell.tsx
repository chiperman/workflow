'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/button';

interface DialogShellProps {
  isOpen: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClassName?: string;
  closeLabel?: string;
}

export function DialogShell({
  isOpen,
  title,
  description,
  onClose,
  children,
  footer,
  maxWidthClassName = 'max-w-xl',
  closeLabel = 'Close dialog',
}: DialogShellProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      const target = dialogRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      target?.focus();
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = '';
      previousFocusRef.current?.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (typeof window === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.1 }}
            className={`relative z-10 flex max-h-[90vh] w-full ${maxWidthClassName} flex-col overflow-hidden rounded-2xl border border-[#e5e5e0] bg-white/95 shadow-2xl backdrop-blur-xl`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            onClick={event => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#f0f0ed] bg-[#fdfcf8]/50 px-6 py-4">
              <div>
                <h2 id={titleId} className="font-serif text-lg font-semibold text-foreground">
                  {title}
                </h2>
                {description && (
                  <p id={descriptionId} className="mt-0.5 text-xs text-text-secondary">
                    {description}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-text-secondary hover:text-foreground"
                aria-label={closeLabel}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>

            <div className="overflow-y-auto p-6">{children}</div>
            {footer}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
