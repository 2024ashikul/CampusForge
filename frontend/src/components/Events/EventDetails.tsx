import React from 'react';
import MDEditor from "@uiw/react-md-editor";

interface EventDetailsTabProps {
    descriptionMarkdown: string;
}

export const EventDetailsTab: React.FC<EventDetailsTabProps> = ({
    descriptionMarkdown = ''
}) => {
    // Dynamically look up the current active theme right during runtime execution
    const currentTheme = typeof window !== 'undefined' 
        ? (window.document.documentElement.getAttribute('data-color-mode') === 'light' ? 'light' : 'dark')
        : 'dark';

    return (
        <div className="bg-card border border-customBorder rounded-xl space-y-4 animate-fade-in transition-colors duration-200">


            {/* CORE RENDERING LOGIC STRATEGY */}
            <div className="wmde-markdown-var-override">
                 
                    
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
            
            </div>        

        </div>
    );
};

export default EventDetailsTab;