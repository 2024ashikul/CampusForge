import React from 'react';
import MDEditor from "@uiw/react-md-editor";

interface EventDetailsTabProps {
    currentRole: 'admin' | 'user' | 'external';
    descriptionMarkdown: string;
    // Callback event handler to stream edited markdown parameters cleanly back up to parent state/API
    onDescriptionChange: (updatedValue: string) => void;
}

export const EventDetailsTab: React.FC<EventDetailsTabProps> = ({
    currentRole,
    descriptionMarkdown = '',
    onDescriptionChange
}) => {
    // Dynamically look up the current active theme right during runtime execution
    const currentTheme = typeof window !== 'undefined' 
        ? (window.document.documentElement.getAttribute('data-color-mode') === 'light' ? 'light' : 'dark')
        : 'dark';

    return (
        <div className="bg-card border border-customBorder rounded-xl p-6 space-y-4 animate-fade-in transition-colors duration-200">

            {/* HEADER CONTROL BLOCK */}
            <div className="flex items-center justify-between border-b border-customBorder pb-3">
                <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-subText">
                        Event Documentation Engine
                    </h3>
                    <p className="text-[11px] text-subText/70 mt-0.5">
                        {currentRole === 'admin' ? 'Editor Instance Hook Unlocked' : 'Read-Only Document View Mode'}
                    </p>
                </div>

                {currentRole === 'admin' && (
                    <span className="px-2.5 py-1 bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold rounded uppercase tracking-wider font-mono">
                        System Admin
                    </span>
                )}
            </div>

            {/* CORE RENDERING LOGIC STRATEGY */}
            <div className="wmde-markdown-var-override">
                {currentRole === 'admin' ? (
                    /* 🛠️ CASE A: ADMIN IS VIEWING - Renders the fully interactive markdown editor canvas */
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-mono text-accent bg-accent/5 border border-accent/20 px-3 py-1.5 rounded-lg mb-2">
                            <span>📝 LIVE DATABASE PAYLOAD BINDER (MARKDOWN)</span>
                            <span className="text-[9px] bg-accent/20 px-1.5 py-0.5 rounded text-accent">ACTIVE CANVAS</span>
                        </div>

                        {/* FIXED: Removed data-color-mode="dark" wrapper so it adapts to theme changes */}
                        <div className="rounded-xl overflow-hidden border border-customBorder">
                            <MDEditor
                                value={descriptionMarkdown}
                                onChange={(value) => onDescriptionChange(value || '')}
                                preview="live" // Shows split layout editor + live compiled layout side-by-side
                                height={450}
                                theme={currentTheme} // FIXED: Forces internal UI matching
                                textareaProps={{
                                    placeholder: 'Begin drafting your event guidelines, matrix tables, and rules...'
                                }}
                            />
                        </div>
                    </div>
                ) : (
                    /* 👁️ CASE B: NORMAL USER / GUEST VIEWING - Renders a sleek, read-only documentation view surface */
                    <div className="space-y-2">
                        {/* FIXED: Replaced static wrapper attributes with custom color rules */}
                        <div className="bg-primary/60 border border-customBorder rounded-xl p-6 min-h-[350px] shadow-sm transition-colors">

                            {!descriptionMarkdown.trim() ? (
                                <div className="flex flex-col items-center justify-center text-center py-20 text-subText">
                                    <p className="font-mono text-xs">&lt;no instruction parameters deployed&gt;</p>
                                    <p className="text-[11px] mt-1">Check back later for structural announcement descriptions.</p>
                                </div>
                            ) : (
                                /* FIXED: Passed inherit and text-mainText classes so typography colors sync natively */
                                <MDEditor.Markdown
                                    source={descriptionMarkdown}
                                    style={{ backgroundColor: 'transparent', color: 'inherit', fontSize: '14px' }}
                                    className="text-mainText"
                                />
                            )}

                        </div>
                    </div>
                )}
            </div>

            {/* FOOTER METRIC HUB */}
            <div className="bg-footer px-4 py-2.5 border border-customBorder rounded-xl text-[10px] text-subText font-mono flex items-center justify-between transition-colors">
                <span>Payload: {descriptionMarkdown.length} Characters</span>
                <span>State Node: eventData.descriptionMarkdown</span>
            </div>

        </div>
    );
};

export default EventDetailsTab;