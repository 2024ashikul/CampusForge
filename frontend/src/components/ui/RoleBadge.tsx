import React from 'react';
import { Crown, UserCheck, Eye, Clock } from 'lucide-react';

export type UserRole = 'ADMIN' | 'ENROLLED' | 'EXTERNAL';
export type PendingStatus = 'pending' | 'approved' | null;

interface RoleBadgeProps {
  role: UserRole;
  pending?: boolean;
  size?: 'sm' | 'md';
}

const config: Record<UserRole, { label: string; icon: React.ReactNode; className: string }> = {
  ADMIN: {
    label: 'Admin',
    icon: <Crown className="w-3 h-3" />,
    className: 'role-badge-admin',
  },
  ENROLLED: {
    label: 'Member',
    icon: <UserCheck className="w-3 h-3" />,
    className: 'role-badge-enrolled',
  },
  EXTERNAL: {
    label: 'Visitor',
    icon: <Eye className="w-3 h-3" />,
    className: 'role-badge-external',
  },
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, pending, size = 'md' }) => {
  const { label, icon, className } = config[role];

  if (pending) {
    return (
      <span className={`role-badge role-badge-pending ${size === 'sm' ? 'text-[10px] px-2 py-0.5' : ''}`}>
        <Clock className="w-3 h-3" /> Pending Approval
      </span>
    );
  }

  return (
    <span className={`role-badge ${className} ${size === 'sm' ? 'text-[10px] px-2 py-0.5' : ''}`}>
      {icon} {label}
    </span>
  );
};

export default RoleBadge;
