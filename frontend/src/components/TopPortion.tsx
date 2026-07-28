import type React from 'react';
import { MapPin, Calendar, Users, Check, UserPlus } from 'lucide-react';
import { RoleBadge, type UserRole } from './ui/RoleBadge';

export type EntityType = 'club' | 'event';

interface TopPortionProps {
  bannerUrl: string;
  logoUrl: string;
  name: string;
  tagline: string;
  location: string;
  founded?: string;
  date?: string;
  time?: string;
  entityType: EntityType;
  userRole: UserRole;
  isPending?: boolean;
  memberCount?: number;
  category?: string;
  onAction?: () => void;
  actionLabel?: string;
  isJoined?: boolean;
  countdown?: React.ReactNode;
}

export const TopPortion: React.FC<TopPortionProps> = ({
  bannerUrl,
  logoUrl,
  name,
  tagline,
  location,
  founded,
  date,
  time,
  entityType,
  userRole,
  isPending,
  memberCount,
  category,
  onAction,
  actionLabel,
  isJoined,
  countdown,
}) => {
  const defaultAction =
    entityType === 'club'
      ? isJoined ? 'Joined' : 'Join Club'
      : isJoined ? 'Registered' : 'Register';

  const label = actionLabel || defaultAction;
  const showAction = !isJoined && onAction;
  const entityLabel = entityType === 'club' ? 'Campus club' : 'Campus event';

  return (
    <section className="w-full max-w-[1180px] mx-auto px-4 sm:px-5 mb-6">
      <div className="glass-panel overflow-hidden">
        <div className="relative h-36 sm:h-44 md:h-52 bg-footer">
          <img src={bannerUrl} alt={`${name} cover`} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
          <span className="absolute top-4 left-4 rounded-full bg-black/35 border border-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
            {entityLabel}
          </span>
        </div>

        <div className="relative px-4 pb-5 sm:px-6 sm:pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between -mt-9 sm:-mt-11">
            <div className="flex min-w-0 items-end gap-3 sm:gap-4">
              <div className="flex h-18 w-18 sm:h-22 sm:w-22 shrink-0 items-center justify-center overflow-hidden rounded-xl border-4 border-card bg-footer text-3xl shadow-card sm:text-4xl">
                {logoUrl.startsWith('http://') || logoUrl.startsWith('https://') || logoUrl.startsWith('/') ? (
                  <img src={logoUrl} alt={`${name} profile`} className="h-full w-full object-cover" />
                ) : logoUrl}
              </div>
              <div className="min-w-0 pt-10 sm:pt-12">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <RoleBadge role={userRole} pending={isPending} />
                  {category && <span className={`category-badge category-${category}`}>{category}</span>}
                </div>
                <h1 className="truncate text-2xl font-bold tracking-tight text-mainText sm:text-3xl">{name}</h1>
                <p className="mt-1 text-xs text-subText sm:text-sm">{tagline}</p>
              </div>
            </div>

            <div className="sm:pb-1 flex flex-wrap items-center gap-2.5">
              {isJoined ? (
                <span className="btn-secondary w-full sm:w-auto text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                  <Check className="w-4 h-4" /> {entityType === 'club' ? 'Member' : 'Registered'}
                </span>
              ) : isPending ? (
                <span className="btn-secondary w-full sm:w-auto text-amber-300 border-amber-500/30 bg-amber-500/10">⏳ Awaiting Approval</span>
              ) : showAction ? (
                <button onClick={onAction} className="btn-primary w-full sm:w-auto">
                  <UserPlus className="w-4 h-4" /> {label}
                </button>
              ) : null}
              {countdown}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-customBorder pt-4 text-xs text-subText">
            {memberCount !== undefined && (
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-accent" /> <strong className="text-mainText">{memberCount}</strong> members</span>
            )}
            {location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-accent" /> {location}</span>}
            {date && <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-accent" /> {date}{time && ` · ${time}`}</span>}
            {founded && <span>Established {founded}</span>}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TopPortion;
