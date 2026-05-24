import React, { useState } from 'react';
import { Megaphone, Link as LinkIcon, Image, ShieldCheck } from 'lucide-react';

interface Announcement {
    id: string;
    date: string;
    author: string;
    content: string;
    imageUrl?: string | null;
    ctaLink?: { label: string; url: string } | null;
}

interface AnnouncementTabProps {
    announcements: Announcement[] | null | undefined;
}

export const AnnouncementTab: React.FC<AnnouncementTabProps> = ({
    announcements
}) => {
    // Local visibility state context for the pop-up modal overlay form canvas



    

    return (
        <div className="space-y-4">
            
            {/* 🛠️ ADMIN BROADCAST CREATION TRIGGER BAR */}
            

            {/* ANNOUNCEMENTS STREAM LIST LAYOUT */}
            {(!announcements || announcements.length === 0) ? (
                // REFACTORED: Styled fallback states dynamically
                <div className="bg-card/40 border border-customBorder rounded-xl py-16 text-center text-subText text-xs font-mono">
                    No announcements broadcasted yet for this session.
                </div>
            ) : (
                announcements.map((ann) => (
                    <div key={ann.id} className="bg-card border border-customBorder rounded-xl overflow-hidden shadow-md animate-fade-in transition-colors duration-200">

                        {/* Embedded optional update graphic banner context */}
                        {ann.imageUrl && (
                            <div className="w-full h-48 overflow-hidden border-b border-customBorder">
                                <img src={ann.imageUrl} alt="Update Asset" className="w-full h-full object-cover" />
                            </div>
                        )}

                        <div className="p-5 space-y-3">
                            <div className="flex justify-between text-[11px] text-subText">
                                <span className="font-bold text-mainText flex items-center gap-1">
                                    <Megaphone className="w-3.5 h-3.5 text-accent" /> {ann.author}
                                </span>
                                <span>{ann.date}</span>
                            </div>
                            <p className="text-xs md:text-sm text-mainText leading-relaxed">{ann.content}</p>

                            {/* Attached Action Callout Link */}
                            {ann.ctaLink && (
                                <div className="pt-2">
                                    <a
                                        href={ann.ctaLink.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        // REFACTORED: Background links pull variable definitions natively
                                        className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-accentHover font-bold bg-primary px-3 py-1.5 rounded-lg border border-customBorder transition-colors"
                                    >
                                        <LinkIcon className="w-3.5 h-3.5" /> {ann.ctaLink.label}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                ))
            )}

        </div>
    );
};