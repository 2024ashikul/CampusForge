import React from 'react';

interface Registrant {
    id: string;
    name: string;
    department: string;
    teamName: string;
}

interface ParticipantsTabProps {
    eventType: 'individual' | 'team';
    registrants: Registrant[] | undefined | null;
    expandedTeams: Record<string, boolean>;
    setExpandedTeams: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export const ParticipantsTab: React.FC<ParticipantsTabProps> = ({
    eventType,
    registrants = [],
    expandedTeams,
    setExpandedTeams
}) => {
    // 1. Group the flat database array rows into structural objects by matching team names
    const groupedRegistrants: Record<string, Registrant[]> = {};

    (registrants || []).forEach((registrant) => {
        // If individual, treat each record as its own unique structural group key row
        const key = eventType === 'individual' ? registrant.id : registrant.teamName;
        if (!groupedRegistrants[key]) {
            groupedRegistrants[key] = [];
        }
        groupedRegistrants[key].push(registrant);
    });

    const totalGroups = Object.keys(groupedRegistrants).length;

    return (
        // REFACTORED: Root wrappers inherit text-mainText rules smoothly
        <div className="space-y-4 animate-fade-in text-mainText transition-colors duration-200">

            {/* MODULE CONTROLLER META STATISTICS BANNER */}
            <div className="flex items-center justify-between border-b border-customBorder pb-3">
                <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-subText">
                        Registered Rosters Terminal
                    </h3>
                    <p className="text-[11px] text-subText/60 mt-0.5 font-medium">
                        Format Scheme: {eventType === 'individual' ? 'Solo Match-Up Node' : 'Squad Entities Registry'}
                    </p>
                </div>
                {/* REFACTORED: Count badge configured with your card and accent design definitions */}
                <span className="text-[10px] font-mono font-bold bg-card border border-customBorder text-accent px-2.5 py-1 rounded-lg transition-colors">
                    Verified Count: {totalGroups} {eventType === 'individual' ? 'Hackers' : 'Teams'}
                </span>
            </div>

            {/* DEFENSIVE BOUNDS CHECK IF LIST ENTRIES REMAIN EMPTY */}
            {(registrants || []).length === 0 ? (
                <div className="bg-card/40 border border-customBorder rounded-xl py-16 text-center text-xs text-subText font-mono">
                    No participant rosters committed to database node.
                </div>
            ) : (
                <div className="space-y-2.5">
                    {Object.entries(groupedRegistrants).map(([groupKey, members]) => {

                        // --- VARIANT A: INDIVIDUAL STRUCTURAL VIEWPORT ---
                        if (eventType === 'individual') {
                            const hacker = members[0];
                            return (
                                <div
                                    key={groupKey}
                                    // REFACTORED: Card uses variables and has adaptive interactive border hovers
                                    className="bg-card border border-customBorder rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-accent/40 transition-colors duration-200"
                                >
                                    <div className="flex items-center gap-3">
                                        {/* REFACTORED: SVG container links up to active accents */}
                                        <div className="w-9 h-9 bg-accent/10 border border-accent/20 text-accent rounded-lg flex items-center justify-center shrink-0">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-mainText">{hacker.name}</h4>
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-subText mt-0.5 font-medium">
                                                <span>ID: <code className="font-mono text-mainText/80">{hacker.id}</code></span>
                                                <span className="text-subText/40">•</span>
                                                <span>Dept: {hacker.department}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-mono uppercase bg-primary px-2 py-0.5 rounded border border-customBorder text-subText font-bold self-start sm:self-center transition-colors">
                                        Solo Operative
                                    </div>
                                </div>
                            );
                        }

                        // --- VARIANT B: TEAM BASED COLLAPSIBLE STRUCTURE ---
                        const isTeamOpen = !!expandedTeams[groupKey];
                        return (
                            <div
                                key={groupKey}
                                className="bg-card border border-customBorder rounded-xl overflow-hidden transition-all duration-150"
                            >
                                <div
                                    onClick={() => setExpandedTeams(prev => ({ ...prev, [groupKey]: !prev[groupKey] }))}
                                    // REFACTORED: Updated internal hovers to match transparent variable layers
                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-primary/50 transition-colors select-none"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        {/* REFACTORED: Team graphics now map to active brand accent schemes */}
                                        <div className="w-9 h-9 bg-accent/10 border border-accent/20 text-accent rounded-lg flex items-center justify-center shrink-0">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.656-5.64 9.093 9.093 0 01-3.122 3.336 9.094 9.094 0 00-3.741-.479 3 3 0 00-4.656 5.64 9.093 9.093 0 013.122-3.336 9 9 0 1113.415 0zM1.5 18.662a4.487 4.487 0 00-1.243-.284 4 4 0 014.28-4.28c.135.006.269.014.402.024a9.096 9.096 0 00-3.439 4.54zM23.743 18.378a4.487 4.487 0 00-1.243-.284 4 4 0 014.28-4.28c.135.006.269.014.402.024a9.096 9.096 0 00-3.439 4.54zM12 2.25a3 3 0 100 6 3 3 0 000-6zM3.75 5.25a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zM20.25 5.25a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" /></svg>
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-sm font-black text-mainText truncate">{groupKey}</h4>
                                            <p className="text-[10px] text-subText mt-0.5 font-bold uppercase tracking-wider">
                                                {members.length} Squad Positions Bound
                                            </p>
                                        </div>
                                    </div>

                                    {/* REFACTORED: Chevron indicator color adapts upon layout expansion */}
                                    <svg
                                        className={`w-4 h-4 text-subText transform transition-transform duration-200 ${isTeamOpen ? 'rotate-90 text-accent' : ''}`}
                                        fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                    </svg>
                                </div>

                                {isTeamOpen && (
                                    // REFACTORED: Inner nested tray background updates to primary/60 matching architecture spec
                                    <div className="bg-primary/60 px-4 pb-4 pt-1 border-t border-customBorder animate-fade-in transition-colors duration-200">
                                        <div className="divide-y divide-customBorder/40">
                                            {members.map((member, idx) => (
                                                <div key={member.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 first:pt-2 last:pb-1">
                                                    <div className="space-y-0.5">
                                                        <div className="text-xs font-bold text-mainText flex items-center gap-2">
                                                            <span>{member.name}</span>
                                                            {idx === 0 && (
                                                                // REFACTORED: Captain badge hooks into dynamic color engine
                                                                <span className="text-[9px] font-mono uppercase bg-accent/10 text-accent border border-accent/20 px-1.5 py-0.2 rounded font-bold">
                                                                    Captain
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] text-subText font-medium flex items-center gap-3">
                                                            <span>ID: <code className="font-mono text-mainText/80">{member.id}</code></span>
                                                            <span className="text-subText/40">•</span>
                                                            <span>Dept: {member.department}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-[10px] font-mono text-subText/70 bg-footer border border-customBorder px-1.5 py-0.5 rounded self-start sm:self-center transition-colors">
                                                        Verified Instance
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};