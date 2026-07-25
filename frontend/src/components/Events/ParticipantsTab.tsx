import React from 'react';

interface Registrant {
    id: string;
    name: string;
    department: string;
    teamName: string;
    role?: 'admin' | 'participant' | string;
}

interface ParticipantsTabProps {
    eventType: 'individual' | 'team';
    registrants: Registrant[] | undefined | null;
    expandedTeams: Record<string, boolean>;
    setExpandedTeams: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

// Helper to get 2-letter initials (e.g. "Ashikul Islam" -> "AS")
const getInitials = (name: string): string => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const ParticipantsTab: React.FC<ParticipantsTabProps> = ({
    eventType,
    registrants = [],
    expandedTeams,
    setExpandedTeams
}) => {
    // 1. Separate Admins and Participants
    const admins = (registrants || []).filter(r => r.role === 'admin');
    const participantList = (registrants || []).filter(r => r.role !== 'admin');

    // 2. Group participants by Team Name (or ID for individual)
    const groupedParticipants: Record<string, Registrant[]> = {};
    participantList.forEach((registrant) => {
        const key = eventType === 'individual' ? registrant.id : (registrant.teamName || 'Unassigned');
        if (!groupedParticipants[key]) {
            groupedParticipants[key] = [];
        }
        groupedParticipants[key].push(registrant);
    });

    const totalCount = (registrants || []).length;

    return (
        <div className="space-y-6 text-mainText">

            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-customBorder pb-3">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                    <h3 className="text-sm font-bold text-mainText">Registered Participants</h3>
                </div>
                <span className="text-xs font-mono text-subText">
                    {totalCount} Total
                </span>
            </div>

            {/* --- SECTION 1: ADMINS --- */}
            {admins.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-subText">Admins</h4>
                    <div className="space-y-2.5">
                        {admins.map((admin) => (
                            <div
                                key={admin.id}
                                className="bg-card border border-customBorder rounded-xl p-4 flex items-center justify-between gap-4"
                            >
                                {/* LEFT: NAME, ID, AND ROLE (e.g. Media Manager from teamName) */}
                                <div className="space-y-0.5 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h5 className="text-sm font-bold text-mainText truncate">{admin.name}</h5>
                                        <span className="text-[10px] font-mono font-semibold text-accent bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded">
                                            ID: {admin.id}
                                        </span>
                                    </div>
                                    <p className="text-xs text-subText font-medium capitalize">
                                        {admin.teamName || 'Event Admin'}
                                    </p>
                                </div>

                                {/* RIGHT: AVATAR WITH INITIALS */}
                                <div className="w-8 h-8 rounded-full border border-customBorder bg-card/60 text-emerald-500 font-bold text-xs flex items-center justify-center shrink-0">
                                    {getInitials(admin.name)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- SECTION 2: PARTICIPANTS --- */}
            <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-subText">Participants</h4>

                {Object.keys(groupedParticipants).length === 0 ? (
                    <div className="bg-card/40 border border-customBorder rounded-xl py-12 text-center text-xs text-subText font-mono">
                        No registered participants found.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {Object.entries(groupedParticipants).map(([teamName, members]) => (
                            <div
                                key={teamName}
                                className="bg-card border border-customBorder rounded-xl overflow-hidden"
                            >
                                {/* TEAM TITLE BAR */}
                                <div className="bg-card/80 px-4 py-3 border-b border-customBorder/60">
                                    <h5 className="text-sm font-bold text-mainText">{teamName}</h5>
                                </div>

                                {/* PARTICIPANT CELLS GRID (MATCHES YOUR IMAGE GRID) */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-customBorder/40">
                                    {members.map((member) => (
                                        <div
                                            key={member.id}
                                            className="p-4 flex items-center justify-center gap-2.5"
                                        >
                                            {/* CIRCULAR AVATAR INITIALS */}
                                            <div className="w-9 h-9 rounded-full border border-customBorder bg-card/60 text-emerald-500 font-bold text-xs flex items-center justify-center shrink-0">
                                                {getInitials(member.name)}
                                            </div>

                                            {/* ID DISPLAYED DIRECTLY BESIDE THE ICON */}
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs font-bold text-mainText truncate">{member.name}</span>
                                                <code className="text-[10px] font-mono text-accent font-bold">
                                                    ID: {member.id}
                                                </code>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};