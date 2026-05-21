import React, { useState } from 'react';
import { PostCard } from './ClubPostComponent';
import type { AdvancedPost } from './Posts/PostInterfaces';
import { FileText, Image as ImageIcon, Video, Link as LinkIcon, Layers, Cpu, Sparkles } from 'lucide-react';

// --- SHOWCASE DUMMY MOCK VALUES ---
const dummyScenarios: Record<string, AdvancedPost> = {
  markdown: {
    id: 'demo-1',
    type: 'student',
    title: '📝 MDEditor Raw Output & Rendering Validation',
    createdAt: '2 mins ago',
    author: { id: 'a1', name: 'Alex Rivera', avatar: 'AR', role: 'UI Contributor' },
    markdownContent: `### Rich Text System Test
This text is created using rich-text markup layout arrays.

#### Key Features Checked:
* Includes **bold emphasis styling font brackets**
* Supports code markers like \`const isLoaded = true;\`
* Organizes tables automatically:

| Component Layout | Style Strategy | Hydration |
| :--- | :--- | :--- |
| Post Card | Tailwind CSS | Client Side |`,
    reactions: [{ emoji: '🔥', count: 12, userReacted: true }, { emoji: '🧠', count: 4, userReacted: false }],
    comments: [{ id: 'c1', author: { id: 'a2', name: 'Emily Chen', avatar: 'EC' }, content: 'Wow, the text layout renders perfectly!', createdAt: '1 min ago' }]
  },

  project: {
    id: 'demo-2',
    type: 'project',
    title: '🚀 SynthEcho: Audio-to-MIDI Neural Project Node',
    createdAt: '1 hour ago',
    author: { id: 'a3', name: 'CampusForge Lab', avatar: '⚙️', role: 'Core Project' },
    markdownContent: `We successfully built a transformer node processing polyphonic instruments directly inside client layers using optimized WebAssembly loops. Check it out!`,
    projectDetails: {
      techStack: ['PyTorch', 'Rust', 'Next.js', 'WebAudio API'],
      githubUrl: 'https://github.com/example/synthecho',
      liveUrl: 'https://synthecho.dev'
    },
    reactions: [{ emoji: '🚀', count: 45, userReacted: false }, { emoji: '🙌', count: 18, userReacted: true }],
    comments: []
  },

  mediaImage: {
    id: 'demo-3',
    type: 'student',
    title: '🎨 Figma Dark Interface Layout Blueprint',
    createdAt: '4 hours ago',
    author: { id: 'a4', name: 'Sarah Jenkins', avatar: 'SJ', role: 'UX Designer' },
    markdownContent: `Just wrapped up the high-fidelity mockups for our upcoming developer platform layout workspace. Kept the contrast ratios highly readable!`,
    media: [{ type: 'image', url: 'https://images.unsplash.com/photo-1541462608141-ad4979e408c9?auto=format&fit=crop&w=1000&q=80' }],
    reactions: [{ emoji: '❤️', count: 24, userReacted: false }],
    comments: []
  },

  mediaVideo: {
    id: 'demo-4',
    type: 'club',
    title: '🎬 Hackathon Opening Ceremonies & Rule Briefing',
    createdAt: '1 day ago',
    author: { id: 'a5', name: 'CampusForge AI', avatar: '⚙️', role: 'Official Admin' },
    markdownContent: `Missed our live orientation presentation? Watch the full recap attached directly below for details on layout timelines and track benchmarks.`,
    media: [{ type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4', thumbnailUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=80' }],
    reactions: [{ emoji: '👀', count: 32, userReacted: false }],
    comments: []
  },

  mediaLink: {
    id: 'demo-5',
    type: 'club',
    title: '🔗 Reference: Layout Structuring & Core Framework Docs',
    createdAt: '2 days ago',
    author: { id: 'a6', name: 'System Wiki', avatar: '📚' },
    markdownContent: `Please make sure your teams read through the global UI optimization blueprints before initializing development pipelines:`,
    media: [{ type: 'link', url: 'https://react.dev', title: 'React Documentation Portal', description: 'Explore rendering rules, context tree lifecycles, layout effects, and concurrent memory management engines.', thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=400&q=80' }],
    reactions: [{ emoji: '🔖', count: 15, userReacted: true }],
    comments: []
  }
};

export const PostShowcaseDashboard: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState<string>('markdown');

  const triggers = [
    { key: 'markdown', label: 'Rich Text Output', icon: FileText, desc: 'MDEditor text, tables & titles' },
    { key: 'project', label: 'Project Repos & Stack', icon: Cpu, desc: 'GitHub links & tech stack rows' },
    { key: 'mediaImage', label: 'Image Attachments', icon: ImageIcon, desc: 'High-res image frame rendering' },
    { key: 'mediaVideo', label: 'Video Clip Assets', icon: Video, desc: 'Custom play overlay stream containers' },
    { key: 'mediaLink', label: 'Parsed Web Links', icon: LinkIcon, desc: 'Structured link card metadata views' }
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
          <PostCard post={dummyScenarios[activeScenario]} />
        </div>

      </div>

    </div>
  );
};

export default PostShowcaseDashboard;