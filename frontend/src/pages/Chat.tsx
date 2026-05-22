import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Send, RefreshCw, Users, MessageSquare, Plus } from 'lucide-react';

// --- Using your shared mock architecture ---
import type { SkillLevel } from '../interfaces/student.type';

interface LocalMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  createdAt: string;
}

interface LocalRoom {
  id: string;
  type: 'DIRECT_MESSAGE' | 'GROUP_CHANNEL';
  name: string;
  logo: string;
  memberIds: string[];
  lastMessageExcerpt: string;
  updatedAt: string;
}

// --- Initial Mock Repositories ---
const INITIAL_ROOMS: LocalRoom[] = [
  {
    id: 'room-1',
    type: 'GROUP_CHANNEL',
    name: 'AI Guild Core Team',
    logo: '🏰',
    memberIds: ['current-user', 'STU-9912'],
    lastMessageExcerpt: 'Let\'s finalize the sandbox environment specs.',
    updatedAt: '10m ago'
  },
  {
    id: 'room-2',
    type: 'DIRECT_MESSAGE',
    name: 'Sarah Chen',
    logo: '👩‍💻',
    memberIds: ['current-user', 'STU-9912'],
    lastMessageExcerpt: 'Bypassing the heap allocation worked flawlessly.',
    updatedAt: '1h ago'
  },
  {
    id: 'room-3',
    type: 'GROUP_CHANNEL',
    name: 'Rover Firmware Track',
    logo: '🤖',
    memberIds: ['current-user', 'STU-0841'],
    lastMessageExcerpt: 'Task priorities are compiling now.',
    updatedAt: 'Yesterday'
  }
];

const INITIAL_MESSAGES: LocalMessage[] = [
  {
    id: 'm-1',
    roomId: 'room-2',
    senderId: 'STU-9912',
    senderName: 'Sarah Chen',
    senderAvatar: '👩‍💻',
    text: 'Hey Alex, did you review the zero-allocation data buffers I committed yesterday?',
    createdAt: '3:02 PM'
  },
  {
    id: 'm-2',
    roomId: 'room-2',
    senderId: 'current-user',
    senderName: 'Alex Rivera',
    senderAvatar: '👨‍💻',
    text: 'Yeah, just checked the benchmarks. The local pool synchronization looks incredibly solid.',
    createdAt: '3:05 PM'
  }
];

export const ChatWorkspace: React.FC = () => {
  const [rooms, setRooms] = useState<LocalRoom[]>(INITIAL_ROOMS);
  const [messages, setMessages] = useState<LocalMessage[]>(INITIAL_MESSAGES);
  const [activeRoomId, setActiveRoomId] = useState<string>('room-2');
  const [typedMessage, setTypedMessage] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  const messageEndRef = useRef<HTMLDivElement>(null);

  // --- Auto Scroll Anchor ---
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeRoomId]);

  // --- Simulated Automatic Refresh Pipeline (Polling Engine) ---
  useEffect(() => {
    // Polls for "new network packets" every 8 seconds automatically
    const pollingInterval = setInterval(() => {
      triggerSilentRefresh();
    }, 8000);

    return () => clearInterval(pollingInterval);
  }, [activeRoomId]);

  const triggerSilentRefresh = () => {
    // Simulating background data fetch increments
    if (activeRoomId === 'room-1' && !messages.some(m => m.id === 'simulated-pull')) {
      const backgroundPacket: LocalMessage = {
        id: 'simulated-pull',
        roomId: 'room-1',
        senderId: 'STU-9912',
        senderName: 'Sarah Chen',
        senderAvatar: '👩‍💻',
        text: '[Auto-Refresh Packet] Pushed new validation routines to master.',
        createdAt: 'Just now'
      };
      setMessages(prev => [...prev, backgroundPacket]);
    }
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      triggerSilentRefresh();
      setIsRefreshing(false);
    }, 6000); // Visual spinning simulation block
  };

  // --- Message Interception Form Dispatcher ---
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;

    const newMessage: LocalMessage = {
      id: `msg-${Date.now()}`,
      roomId: activeRoomId,
      senderId: 'current-user',
      senderName: 'Alex Rivera',
      senderAvatar: '👨‍💻',
      text: typedMessage,
      createdAt: 'Just now'
    };

    setMessages([...messages, newMessage]);
    
    // Mutate parent list structures to hold excerpt details
    setRooms(prevRooms => prevRooms.map(r => {
      if (r.id === activeRoomId) {
        return { ...r, lastMessageExcerpt: typedMessage, updatedAt: 'Just now' };
      }
      return r;
    }));

    setTypedMessage('');
  };

  const currentActiveRoom = useMemo(() => {
    return rooms.find(r => r.id === activeRoomId);
  }, [rooms, activeRoomId]);

  const filteredMessages = useMemo(() => {
    return messages.filter(m => m.roomId === activeRoomId);
  }, [messages, activeRoomId]);

  return (
    <div className="min-h-[80vh] bg-card border border-customBorder rounded-2xl overflow-hidden flex flex-col md:flex-row transition-all max-w-6xl mx-auto">
      
      {/* ==========================================
          LEFT COLUMN: ACTIVE ROOM CHANNELS RADAR (35%)
          ========================================== */}
      <div className="w-full md:w-80 bg-footer border-b md:border-b-0 md:border-r border-customBorder flex flex-col justify-between shrink-0">
        
        {/* Workspace Operations Top Action Segment */}
        <div>
          <div className="p-4 border-b border-customBorder flex items-center justify-between">
            <h3 className="text-sm font-black text-mainText uppercase tracking-wider">Comms Directory</h3>
            <button 
              onClick={handleManualRefresh}
              className={`p-1.5 rounded-lg border border-customBorder bg-primary text-subText hover:text-accent transition-all cursor-pointer ${isRefreshing ? 'animate-spin' : ''}`}
              title="Manual Fetch Packets"
            >
              <RefreshCw size={13} />
            </button>
          </div>

          {/* Dynamic Channels Roster Stream */}
          <div className="p-2 space-y-1 max-h-[50vh] overflow-y-auto">
            {rooms.map((room) => {
              const isSelected = room.id === activeRoomId;
              return (
                <div
                  key={room.id}
                  onClick={() => setActiveRoomId(room.id)}
                  className={`p-3 rounded-xl flex items-start gap-3 cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-primary border border-customBorder text-mainText shadow-xs' 
                      : 'hover:bg-primary/40 border border-transparent text-subText'
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-card border border-customBorder flex items-center justify-center text-md shrink-0 shadow-inner">
                    {room.logo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-1">
                      <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-accent' : 'text-mainText'}`}>
                        {room.name}
                      </h4>
                      <span className="text-[8px] font-mono text-subText/50 shrink-0">{room.updatedAt}</span>
                    </div>
                    <p className="text-[11px] text-subText truncate mt-0.5 font-sans leading-none">
                      {room.lastMessageExcerpt}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Channel Generation Action Footing */}
        <div className="p-3 border-t border-customBorder bg-card/30">
          <button className="w-full py-2 bg-primary hover:bg-card border border-customBorder hover:border-accent text-mainText hover:text-accent font-black text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5">
            <Plus size={14} strokeWidth={3} /> Establish Node Session
          </button>
        </div>

      </div>

      {/* ==========================================
          RIGHT COLUMN: COMMUNICATIONS CONSOLE VIEWPORT (65%)
          ========================================== */}
      <div className="flex-1 bg-primary/20 flex flex-col justify-between min-h-[500px]">
        
        {/* Stream Channel Metadata Header */}
        <div className="px-6 py-3.5 bg-footer border-b border-customBorder flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">{currentActiveRoom?.logo}</span>
            <div>
              <h4 className="text-sm font-black text-mainText leading-none">{currentActiveRoom?.name}</h4>
              <span className="text-[10px] font-mono text-subText mt-1 block">
                Channel Type: <span className="text-accent">{currentActiveRoom?.type.replace('_', ' ')}</span>
              </span>
            </div>
          </div>
          <span className="text-[9px] font-mono text-subText/40 hidden sm:inline">
            Status: Synchronized via Auto-Polling (8s)
          </span>
        </div>

        {/* Main Scrolling Communication Content Shell */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {filteredMessages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-center opacity-60">
              <p className="text-xs font-mono text-subText">No logs recorded inside this communication array frame.</p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isCurrentUser = msg.senderId === 'current-user';

              return (
                <div 
                  key={msg.id} 
                  className={`flex gap-3 max-w-[85%] ${isCurrentUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                >
                  {/* Participant Avatar */}
                  <div className="w-8 h-8 rounded-lg bg-footer border border-customBorder flex items-center justify-center text-sm shrink-0 shadow-xs">
                    {msg.senderAvatar}
                  </div>

                  {/* Packet Bubble Element Wrapper */}
                  <div className="space-y-1">
                    <div className={`flex items-baseline gap-2 ${isCurrentUser ? 'justify-end' : ''}`}>
                      <span className="text-[10px] font-black text-mainText">{msg.senderName}</span>
                      <span className="text-[8px] font-mono text-subText/60">{msg.createdAt}</span>
                    </div>
                    <div className={`p-3 rounded-xl border text-xs leading-relaxed font-sans ${
                      isCurrentUser 
                        ? 'bg-accent/10 border-accent text-mainText rounded-tr-none' 
                        : 'bg-card border-customBorder text-mainText rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messageEndRef} />
        </div>

        {/* Message Entry Payload Dispatch Control Input */}
        <form 
          onSubmit={handleSendMessage}
          className="p-4 bg-footer border-t border-customBorder flex gap-2 items-center"
        >
          <input
            type="text"
            placeholder={`Transmit system packet line to ${currentActiveRoom?.name}...`}
            value={typedMessage}
            onChange={(e) => setTypedMessage(e.target.value)}
            className="flex-1 bg-primary text-mainText text-xs px-3 py-2.5 rounded-xl border border-customBorder focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-subText/40"
          />
          <button
            type="submit"
            className="p-2.5 bg-accent text-primary rounded-xl hover:opacity-90 active:scale-[0.96] transition-all cursor-pointer shrink-0 shadow-md"
          >
            <Send size={14} strokeWidth={2.5} />
          </button>
        </form>

      </div>

    </div>
  );
};

export default ChatWorkspace;