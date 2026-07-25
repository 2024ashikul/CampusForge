import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  accent?: 'default' | 'purple' | 'amber';
  maxWidth?: string;
}

const accentBorder: Record<string, string> = {
  default: 'border-accent/30',
  purple: 'border-purple-500/30',
  amber: 'border-amber-500/30',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  accent = 'default',
  maxWidth = 'max-w-lg',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${maxWidth} glass-panel rounded-2xl p-6 border ${accentBorder[accent]} shadow-2xl z-10 animate-scale-up`}
      >
        <div className="flex justify-between items-center border-b border-customBorder pb-4 mb-5">
          <div className="text-sm font-bold text-mainText">{title}</div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-subText hover:text-mainText hover:bg-footer transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
