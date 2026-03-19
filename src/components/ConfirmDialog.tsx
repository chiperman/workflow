'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap, keyboard handling, and scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    },
    [onCancel]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  const variantStyles = {
    danger: {
      icon: 'text-accent-primary',
      iconBg: 'bg-accent-primary/10',
    },
    warning: {
      icon: 'text-amber-600',
      iconBg: 'bg-amber-50',
    },
    default: {
      icon: 'text-text-tertiary',
      iconBg: 'bg-[#f5f5f0]',
    },
  };

  const styles = variantStyles[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed -inset-20 bg-black/20 backdrop-blur-sm z-50"
            onClick={onCancel}
          />

          {/* Dialog */}
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.3, bounce: 0.15 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-[380px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
          >
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/10 border border-[#e5e5e0]/50 overflow-hidden relative">
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onCancel}
                className="absolute top-4 right-4 text-text-secondary hover:text-foreground"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </Button>

              {/* Content */}
              <div className="p-6 pt-8">
                {/* Icon */}
                <div
                  className={`mx-auto w-12 h-12 ${styles.iconBg} rounded-full flex items-center justify-center mb-4`}
                >
                  <AlertTriangle className={`w-6 h-6 ${styles.icon}`} />
                </div>

                {/* Title */}
                <h2
                  id="dialog-title"
                  className="text-lg font-medium text-foreground text-center mb-2"
                >
                  {title}
                </h2>

                {/* Message */}
                <p className="text-sm text-text-tertiary text-center leading-relaxed">{message}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 px-6 pb-6">
                <Button variant="secondary" onClick={onCancel} className="flex-1 h-11">
                  {cancelText}
                </Button>
                <Button
                  variant={variant === 'danger' ? 'brand' : 'default'}
                  onClick={onConfirm}
                  className="flex-1 h-11 shadow-sm"
                >
                  {confirmText}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
