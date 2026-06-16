import React from 'react';
import { TuiButton } from './TuiButton';

interface TuiAlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'alert' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export const TuiAlertModal: React.FC<TuiAlertModalProps> = ({
  visible,
  title,
  message,
  type = 'alert',
  confirmText = 'OK',
  cancelText = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 p-4 animate-in fade-in duration-100 select-none">
      <div className="w-full max-w-sm border-[1.5px] border-primary bg-card p-6">
        <div className="border-b-[1.5px] border-primary pb-2 mb-4">
          <span className="font-bold text-xs uppercase text-primary">[ {title} ]</span>
        </div>
        <p className="text-sm font-mono leading-relaxed mb-6 text-foreground break-words whitespace-pre-wrap">
          {message}
        </p>
        <div className="flex gap-4">
          {type === 'confirm' && onCancel && (
            <TuiButton
              onPress={onCancel}
              variant="outline"
              className="flex-1"
            >
              {cancelText}
            </TuiButton>
          )}
          <TuiButton
            onPress={onConfirm}
            variant={isDestructive ? 'destructive' : 'accent'}
            className="flex-1"
          >
            {confirmText}
          </TuiButton>
        </div>
      </div>
    </div>
  );
};
