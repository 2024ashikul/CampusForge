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
    currentRole: 'admin' | 'user' | 'external';
    announcements: Announcement[] | null | undefined;
    onPostAnnouncement: (freshAnn: Announcement) => void;
}

export const AnnouncementTab: React.FC<AnnouncementTabProps> = ({
    currentRole,
    announcements,
    onPostAnnouncement
}) => {
    // Local visibility state context for the pop-up modal overlay form canvas
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Internal state controllers for the form data inputs
    const [announcementText, setAnnouncementText] = useState('');
    const [annImage, setAnnImage] = useState('');
    const [annLinkLabel, setAnnLinkLabel] = useState('');
    const [annLinkUrl, setAnnLinkUrl] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!announcementText.trim()) return;

        const freshAnn: Announcement = {
            id: Date.now().toString(),
            date: 'Just Now',
            author: 'You (Admin Panel)',
            content: announcementText,
            imageUrl: annImage.trim() ? annImage : null,
            ctaLink: annLinkLabel.trim() && annLinkUrl.trim() ? { label: annLinkLabel, url: annLinkUrl } : null
        };

        // Emit instance back up to parent database handler hook context
        onPostAnnouncement(freshAnn);

        // Reset local interface controls back to baseline parameters
        setAnnouncementText('');
        setAnnImage('');
        setAnnLinkLabel('');
        setAnnLinkUrl('');
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-4">
            
            {/* 🛠️ ADMIN BROADCAST CREATION TRIGGER BAR */}
            {currentRole === 'admin' && (
                // REFACTORED: Converted background layout frames and borders
                <div className="bg-card border border-customBorder p-4 rounded-xl flex items-center justify-between shadow-md transition-colors duration-200">
                    <div>
                        <span className="text-[10px] text-accent font-mono font-bold uppercase tracking-wider block">// Communication Pipeline</span>
                        <h4 className="text-xs font-bold text-mainText mt-0.5">Broadcast System Deployment Terminal</h4>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        // REFACTORED: Gradients utilize accent tokens to scale cleanly across modes
                        className="px-4 py-2 bg-gradient-to-r from-accent to-accentHover text-primary font-black rounded-lg text-xs tracking-wide transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                        <Megaphone className="w-3.5 h-3.5" />
                        Create Announcement
                    </button>
                </div>
            )}

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

            {/* ==========================================
                🪐 POP-UP FLOATING OVERLAY MODAL CANVAS
                ========================================== */}
            {isModalOpen && (
                // REFACTORED: Backdrops match theme darkness values seamlessly
                <div className="fixed inset-0 bg-black/50 dark:bg-[#060A10]/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-card border border-customBorder w-full max-w-xl rounded-xl shadow-2xl overflow-hidden transform transition-all scale-100 duration-200">
                        
                        {/* Modal Header */}
                        <div className="px-5 py-4 border-b border-customBorder flex items-center justify-between bg-footer transition-colors duration-200">
                            <div className="flex items-center gap-2 text-xs font-black text-mainText tracking-wider uppercase">
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                <span>Compose System Broadcast</span>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="text-subText hover:text-mainText font-bold font-mono text-base p-1 cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Dynamic Input Content */}
                        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
                            <div className="space-y-1.5">
                                <label className="font-bold text-mainText block">Broadcast Message Body Content</label>
                                <textarea
                                    rows={4}
                                    required
                                    value={announcementText}
                                    onChange={(e) => setAnnouncementText(e.target.value)}
                                    placeholder="Type rich notification updates, change notifications, or instructions for participants..."
                                    // REFACTORED: Input styles configured globally
                                    className="w-full bg-primary border border-customBorder focus:border-accent rounded-lg p-3 text-xs text-mainText placeholder-subText/50 focus:outline-none resize-none transition-all"
                                />
                            </div>

                            {/* Attachments Section Wrapper */}
                            <div className="space-y-3 bg-primary p-3.5 rounded-xl border border-customBorder transition-colors duration-200">
                                <span className="text-[10px] font-mono font-bold text-subText block uppercase tracking-wide">
                                    Optional Media Attachments Matrix
                                </span>

                                {/* Image Link Input */}
                                <div className="space-y-1">
                                    <span className="text-[10px] text-subText font-medium">Header Banner Asset Image URL</span>
                                    <div className="flex items-center gap-2 bg-card px-3 py-2 rounded-lg border border-customBorder transition-colors">
                                        <Image className="w-3.5 h-3.5 text-subText" />
                                        <input
                                            type="url"
                                            placeholder="https://images.unsplash.com/... (optional)"
                                            value={annImage}
                                            onChange={(e) => setAnnImage(e.target.value)}
                                            className="bg-transparent border-none text-[11px] w-full focus:outline-none placeholder-subText/40 text-mainText"
                                        />
                                    </div>
                                </div>

                                {/* Call To Action Custom URL Controls */}
                                <div className="space-y-1">
                                    <span className="text-[10px] text-subText font-medium">Call-To-Action Hyperlink Target</span>
                                    <div className="flex gap-2">
                                        <div className="flex items-center gap-2 bg-card px-3 py-2 rounded-lg border border-customBorder w-1/3 transition-colors">
                                            <LinkIcon className="w-3.5 h-3.5 text-subText" />
                                            <input
                                                type="text"
                                                placeholder="Button Label"
                                                value={annLinkLabel}
                                                onChange={(e) => setAnnLinkLabel(e.target.value)}
                                                className="bg-transparent border-none text-[11px] w-full focus:outline-none placeholder-subText/40 text-mainText"
                                            />
                                        </div>
                                        <div className="bg-card px-3 py-2 rounded-lg border border-customBorder w-2/3 transition-colors">
                                            <input
                                                type="url"
                                                placeholder="Destination Link Target Address URL"
                                                value={annLinkUrl}
                                                onChange={(e) => setAnnLinkUrl(e.target.value)}
                                                className="bg-transparent border-none text-[11px] w-full focus:outline-none placeholder-subText/40 text-mainText"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action CTA Submission Bar */}
                            <div className="flex gap-2 justify-end pt-2 border-t border-customBorder">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 bg-primary border border-customBorder hover:border-slate-400/40 text-subText font-bold rounded-lg transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-5 py-2 bg-gradient-to-r from-accent to-accentHover hover:opacity-90 text-primary font-black rounded-lg transition-transform active:scale-95 cursor-pointer"
                                >
                                    Publish Notification
                                </button>
                            </div>
                        </form>

                    </div>
                </div>
            )}

        </div>
    );
};