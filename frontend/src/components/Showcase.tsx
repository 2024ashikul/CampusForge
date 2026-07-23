import React, { useState } from 'react';
import { PostCard } from './Posts/PostCard';
import type { PostData } from '../interfaces/post.type';
import { FileText, Image as ImageIcon, Video, Link as LinkIcon, Layers, Cpu, Sparkles } from 'lucide-react';

const dummyScenarios: Record<string, PostData> = {
  markdown: {
    id: 'demo-1',
    title: '📝 MDEditor Raw Output & Rendering Validation',
    postType: 'DISCUSSION',
    createdAt: '2 mins ago',
    author: { id: 'a1', name: 'Alex Rivera', avatar: '👨‍💻', association: 'STUDENT', roleTitle: 'UI Contributor' },
    markdownContent: `### Rich Text System Test
This text is created using rich-text markup layout arrays.

#### Key Features Checked:
* Includes **bold emphasis styling font brackets**
* Supports code markers like \`const isLoaded = true;\`
* Organizes tables automatically:

| Component Layout | Style Strategy | Hydration |
| :--- | :--- | :--- |
| Post Card | Tailwind CSS | Client Side |`,
    attachments: [],
    comments: [{ id: 'c1', postId: 'demo-1', parentId: null, authorName: 'Emily Chen', authorAvatar: '👩‍💻', content: 'Wow, the text layout renders perfectly!', createdAt: '1 min ago', reactions: {} }],
    tags: ['Markdown', 'Validation'],
    reactions: { 'u1': 'LIKE' }
  },

  project: {
    id: 'demo-2',
    title: '🚀 SynthEcho: Audio-to-MIDI Neural Project Node',
    postType: 'PROJECT',
    createdAt: '1 hour ago',
    author: { id: 'a3', name: 'CampusForge Lab', avatar: '⚙️', association: 'CLUB', roleTitle: 'Core Project' },
    markdownContent: `We successfully built a transformer node processing polyphonic instruments directly inside client layers using optimized WebAssembly loops. Check it out!`,
    attachments: [{ id: 'at-1', postId: 'demo-2', type: 'LINK', url: 'https://github.com/example/synthecho', name: 'GitHub Repository' }],
    comments: [],
    tags: ['WebAssembly', 'Rust', 'PyTorch'],
    reactions: { 'u2': 'STAR' }
  }
};

export const PostShowcaseDashboard: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState<string>('markdown');

  const triggers = [
    { key: 'markdown', label: 'Rich Text Output', icon: FileText, desc: 'MDEditor text, tables & titles' },
    { key: 'project', label: 'Project Repos & Stack', icon: Cpu, desc: 'GitHub links & tech stack rows' },
  ];

  return (
    <div className="min-h-screen bg-[#0D1520] text-slate-100 p-4 sm:p-8 font-sans">
      
      {/* HEADER CONTROLS */}
      <div className="max-w-5xl mx-auto mb-8 border-b border-[#1A2635] pb-4">
        <span className="text-[11px] font-bold text-[#C5A25D] bg-[#1C2533] border border-[#243245] px-2 py-0.5 rounded uppercase">UI Layout Demo</span>
        <h1 className="text-2xl font-black mt-2">Post Content Showcase Stage</h1>
        <p className="text-xs text-slate-400 mt-0.5">Toggle through options on the left menu to preview how different mock configurations look live.</p>
      </div>

      {/* DASHBOARD WORKSPACE */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT MENU PANEL */}
        <div className="lg:col-span-5 bg-[#141E2B] border border-[#1A2635] rounded-xl p-3 space-y-1.5">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-[#C5A25D]" /> Layout Targets</p>
          {triggers.map(t => {
            const Icon = t.icon;
            const chosen = activeScenario === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveScenario(t.key)}
                className={`w-full text-left p-3 rounded-lg border transition-all flex items-center space-x-3 group ${
                  chosen ? 'bg-[#1C2533] border-[#C5A25D]/40 text-[#C5A25D]' : 'bg-transparent border-transparent text-slate-400 hover:bg-[#101924]'
                }`}
              >
                <div className={`p-2 rounded-md ${chosen ? 'bg-[#C5A25D] text-[#0D1520]' : 'bg-[#1C2533]'}`}><Icon className="w-4 h-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold flex items-center justify-between"><span>{t.label}</span>{chosen && <Sparkles className="w-3 h-3 text-[#C5A25D]" />}</div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{t.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* RIGHT PREVIEW SCREEN */}
        <div className="lg:col-span-7">
          <PostCard postData={dummyScenarios[activeScenario]} />
        </div>

      </div>

    </div>
  );
};

export default PostShowcaseDashboard;