import React from 'react';
import { Lock, Unlock, Check } from 'lucide-react';
import type { UserRole } from './RoleBadge';

interface AccessItem {
  label: string;
  minRole: UserRole;
}

interface AccessStripProps {
  role: UserRole;
  items: AccessItem[];
  entityType: 'club' | 'event';
}

const roleLevel: Record<UserRole, number> = {
  EXTERNAL: 0,
  ENROLLED: 1,
  ADMIN: 2,
};

export const AccessStrip: React.FC<AccessStripProps> = ({ role, items, entityType }) => {
  const level = roleLevel[role];

  return (
    <div className="access-strip">
      <span className="text-xs font-bold uppercase tracking-wider text-subText mr-1">
        Your {entityType} access:
      </span>
      {items.map((item) => {
        const enabled = level >= roleLevel[item.minRole];
        return (
          <span
            key={item.label}
            className={`access-item ${enabled ? 'enabled' : 'locked'}`}
          >
            {enabled ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Lock className="w-3.5 h-3.5" />
            )}
            {item.label}
          </span>
        );
      })}
    </div>
  );
};

export default AccessStrip;
