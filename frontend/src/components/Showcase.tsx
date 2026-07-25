import React, { useState } from 'react';
import { PostCard } from './Posts/PostCard';
import type { PostData } from '../interfaces/post.type';
import { FileText, Layers, Cpu, Sparkles } from 'lucide-react';

const dummyScenarios: Record<string, PostData> = {
  markdown: {
    id: 'demo-1',
    rawId: 1,
    title: 'Markdown rendering, without the clutter',
    postType: 'post',
    status: 'published',
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
    comments: [{ id: 'c1', postId: 'demo-1', parentId: null, authorName: 'Emily Chen', authorAvatar: '👩‍💻', content: 'Wow, the text layout renders perfectly!', createdAt: '1 min ago' }],
    tags: ['Markdown', 'Validation'],
    reactionCounts: { like: 1 },
    userReaction: 'like',
    clubId: null,
    userId: '2604001',
    commentCount: 1,
  },

  project: {
    id: 'demo-2',
    rawId: 2,
    title: 'SynthEcho: Audio-to-MIDI project',
    postType: 'project',
    status: 'published',
    createdAt: '1 hour ago',
    author: { id: 'a3', name: 'CampusForge Lab', avatar: '⚙️', association: 'CLUB', roleTitle: 'Core Project' },
    markdownContent: `We successfully built a transformer node processing polyphonic instruments directly inside client layers using optimized WebAssembly loops. Check it out!`,
    attachments: [{ id: 'at-1', postId: 'demo-2', type: 'LINK', url: 'https://github.com/example/synthecho', name: 'GitHub Repository' }],
    comments: [],
    tags: ['WebAssembly', 'Rust', 'PyTorch'],
    reactionCounts: { fire: 3 },
    userReaction: 'fire',
    clubId: 1,
    userId: null,
    commentCount: 0,
  }
};

export const PostShowcaseDashboard: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState<string>('markdown');

  const triggers = [
    { key: 'markdown', label: 'Rich Text Output', icon: FileText, desc: 'MDEditor text, tables & titles' },
    { key: 'project', label: 'Project Repos & Stack', icon: Cpu, desc: 'GitHub links & tech stack rows' },
  ];

  return (
    <div className="min-h-screen bg-primary text-mainText p-4 sm:p-8 font-sans">
      
      {/* HEADER CONTROLS */}
      <div className="max-w-5xl mx-auto mb-6 border-b border-customBorder pb-5">
        <span className="text-[10px] font-bold text-accent bg-accent/10 border border-accent/20 px-2 py-1 rounded uppercase tracking-wider">Component preview</span>
        <h1 className="text-2xl font-bold mt-3">Post card showcase</h1>
        <p className="text-sm text-subText mt-1">A clean reading surface for updates, project notes, and shared links.</p>
      </div>

      {/* DASHBOARD WORKSPACE */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT MENU PANEL */}
        <div className="lg:col-span-4 bg-card border border-customBorder rounded-lg p-3 space-y-1.5">
          <p className="text-[10px] font-bold text-subText uppercase tracking-wider px-2 mb-2 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-accent" /> Choose a sample</p>
          {triggers.map(t => {
            const Icon = t.icon;
            const chosen = activeScenario === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveScenario(t.key)}
                className={`w-full text-left p-3 rounded-lg border transition-all flex items-center space-x-3 group ${
                  chosen ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-transparent border-transparent text-subText hover:bg-footer hover:text-mainText'
                }`}
              >
                <div className={`p-2 rounded-md ${chosen ? 'bg-accent text-[#101614]' : 'bg-footer'}`}><Icon className="w-4 h-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold flex items-center justify-between"><span>{t.label}</span>{chosen && <Sparkles className="w-3 h-3 text-accent" />}</div>
                  <p className="text-[11px] text-subText truncate mt-0.5">{t.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* RIGHT PREVIEW SCREEN */}
        <div className="lg:col-span-8">
          <PostCard postData={dummyScenarios[activeScenario]} />
        </div>

      </div>

    </div>
  );
};

export default PostShowcaseDashboard;
