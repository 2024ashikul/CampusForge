import type React from "react";
import { MapPin, Award, ShieldCheck, Clock, Calendar } from 'lucide-react';

// Sync perfectly with the parent view types
export type MemberType = 'admin' | 'member' | 'non_member' | 'announcement';

interface TopPortionProps {
  bannerUrl: string;
  logoUrl: string;
  name: string;
  tagline: string;
  location: string;
  founded?: string;
  date? : string,
  time? : string,
  memberType: MemberType;
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
  memberType
}) => {
  return (
    <>
      {/* 1. HERO BANNER HEADER */}
      <div className="relative w-full h-64 md:h-80 overflow-hidden">
        <img
          src={bannerUrl}
          alt="Club Banner"
          className="w-full h-full object-cover brightness-[0.4]"
        />
        <div className="absolute inset-0 bg-linear-to-t from-primary via-transparent to-transparent" />
      </div>

      {/* 2. CLUB IDENTITY BLOCK (Overlapping Info Section) */}
      <div className="max-w-[var(--width-total)] mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-customBorder">

          {/* Logo & Text info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="w-28 h-28 bg-footer border-4 border-primary rounded-2xl flex items-center justify-center text-4xl shadow-xl transition-colors">
              {logoUrl}
            </div>
            
            <div className="mb-2">
              <h1 className="text-3xl md:text-4xl font-black text-mainText tracking-tight flex items-center gap-2">
                {name}
                <ShieldCheck className="w-6 h-6 text-accent fill-current" />
              </h1>
              <p className="text-accent font-medium text-sm md:text-base mt-1">{tagline}</p>

              <div className="flex flex-wrap gap-4 text-xs text-subText mt-3">
                {founded && 
                <span className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-subText/60" /> Founded {founded}
                </span>
}

                {date && 
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-subText/60" /> {date}
                </span>
}
          {time && 
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-subText/60" /> {time}
                </span>
}
                {location && 
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-subText/60" /> {location}
                </span>
}
              </div>
            </div>
          </div>

          {/* Action Button */}
          {memberType === 'non_member' && (
            <button className="px-6 py-2.5 bg-accent hover:bg-accentHover text-primary font-bold rounded-lg text-sm transition-all duration-200 transform active:scale-95 shadow-lg shadow-accent/10 cursor-pointer">
              Join Club
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default TopPortion;