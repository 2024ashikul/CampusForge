import React from 'react';
import { Sparkles } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;
  return (
    <div className="toast">
      <Sparkles className="w-4 h-4 text-accent shrink-0" />
      {message}
    </div>
  );
};

export default Toast;
