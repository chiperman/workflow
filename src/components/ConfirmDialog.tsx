'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';

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
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap and keyboard handling
  useEffect(() => {
    if (isOpen) {
      confirmButtonRef.current?.focus();
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
      icon: 'text-[#d97757]',
      iconBg: 'bg-[#d97757]/10',
      confirmButton: 'bg-[#d97757] text-white hover:bg-[#c56a4a] active:bg-[#b35d3d]',
    },
    warning: {
      icon: 'text-amber-600',
      iconBg: 'bg-amber-50',
      confirmButton: 'bg-amber-600 text-white hover:bg-amber-700 active:bg-amber-800',
    },
    default: {
      icon: 'text-[#555555]',
      iconBg: 'bg-[#f5f5f0]',
      confirmButton: 'bg-[#191919] text-white hover:bg-[#333333] active:bg-[#444444]',
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
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
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
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/10 border border-[#e5e5e0]/50 overflow-hidden">
              {/* Close button */}
              <button
                onClick={onCancel}
                className="absolute top-4 right-4 p-1.5 text-[#888888] hover:text-[#191919] hover:bg-[#f5f5f0] rounded-lg transition-all duration-200"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>

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
                  className="text-lg font-medium text-[#191919] text-center mb-2"
                >
                  {title}
                </h2>

                {/* Message */}
                <p className="text-sm text-[#555555] text-center leading-relaxed">{message}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 px-6 pb-6">
                <button
                  onClick={onCancel}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-[#555555] bg-[#f5f5f0] hover:bg-[#e8e8e3] active:bg-[#dcdcd7] rounded-xl transition-all duration-200"
                >
                  {cancelText}
                </button>
                <button
                  ref={confirmButtonRef}
                  onClick={onConfirm}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${styles.confirmButton}`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
