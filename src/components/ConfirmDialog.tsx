'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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

  const dialogContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Dialog */}
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.1 }}
            className="bg-white/95 backdrop-blur-xl w-full max-w-md overflow-hidden rounded-2xl shadow-2xl border border-border-custom flex flex-col relative z-10"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#f0f0ed] flex justify-between items-center bg-[#fdfcf8]/50">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 ${styles.iconBg} rounded-lg flex items-center justify-center`}
                >
                  <AlertTriangle className={`w-4 h-4 ${styles.icon}`} />
                </div>
                <h2
                  id="dialog-title"
                  className="text-base font-semibold text-foreground font-serif"
                >
                  {title}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onCancel}
                className="h-8 w-8 text-text-secondary hover:text-foreground"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-sm text-text-secondary leading-relaxed">{message}</p>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3 justify-end">
              <Button variant="secondary" onClick={onCancel} className="px-6 h-10">
                {cancelText}
              </Button>
              <Button
                variant={variant === 'danger' ? 'brand' : 'default'}
                onClick={onConfirm}
                className="px-6 h-10 shadow-sm"
              >
                {confirmText}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // Use portal to render dialog at body level, avoiding parent transform issues
  if (typeof window === 'undefined') return null;
  return createPortal(dialogContent, document.body);
}
