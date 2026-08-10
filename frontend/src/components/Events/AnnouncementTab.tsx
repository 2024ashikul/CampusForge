import React, { useState } from 'react';
import { Megaphone, Link as LinkIcon } from 'lucide-react';
import { ImageViewerModal } from '../ui/ImageViewerModal';

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
    const [viewerUrl, setViewerUrl] = useState<string | null>(null);

    return (
        <div className="space-y-4">
            
            {(!announcements || announcements.length === 0) ? (
                
                <div className="bg-card/40 border border-customBorder rounded-xl py-16 text-center text-subText text-xs font-mono">
                    No announcements broadcasted yet for this session.
                </div>
            ) : (
                announcements.map((ann) => (
                    <div key={ann.id} className="bg-card border border-customBorder rounded-xl overflow-hidden shadow-md animate-fade-in transition-colors duration-200">

                        
                        {ann.imageUrl && (
                            <div
                                onClick={() => setViewerUrl(ann.imageUrl || null)}
                                className="relative w-full h-48 overflow-hidden border-b border-customBorder bg-slate-950 flex items-center justify-center cursor-pointer group"
                                title="Click to view full screen"
                            >
                                <img src={ann.imageUrl} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover filter blur-2xl opacity-40 scale-110 pointer-events-none" />
                                <img src={ann.imageUrl} alt="Update Asset" className="relative z-10 w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.01]" />
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

                            
                            {ann.ctaLink && (
                                <div className="pt-2">
                                    <a
                                        href={ann.ctaLink.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        
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

            <ImageViewerModal
                isOpen={!!viewerUrl}
                images={viewerUrl ? [viewerUrl] : []}
                onClose={() => setViewerUrl(null)}
            />
        </div>
    );
};