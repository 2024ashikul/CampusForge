import type React from 'react';

interface UserAvatarProps {
  name: string;
  src?: string | null;
  className?: string;
  textClassName?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ name, src, className = '', textClassName = '' }) => {
  const initials = name.split(' ').filter(Boolean).map((part) => part[0]).join('').toUpperCase().slice(0, 2) || 'U';
  return (
    <span className={`flex shrink-0 items-center justify-center overflow-hidden bg-accent/15 text-accent ${className}`}>
      {src ? <img src={src} alt={`${name}'s profile`} className="h-full w-full object-cover" /> : <span className={textClassName}>{initials}</span>}
    </span>
  );
};
