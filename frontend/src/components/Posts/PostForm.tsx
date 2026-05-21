import React, { useState, useRef, Suspense } from 'react';
import { Send, Plus, Trash2, X } from 'lucide-react';
 // Import theme hook to pass state to MD editor
import type { PostAttachment } from './PostInterfaces';
import { useTheme } from '../../context/ThemeContext';

const MDEditor = React.lazy(() => import('@uiw/react-md-editor'));

interface PostFormProps {
  onPublish: (title: string, markdown: string, association: 'STUDENT' | 'CLUB', attachments: Omit<PostAttachment, 'id' | 'postId'>[], tags: string[]) => void;
}

export const PostForm: React.FC<PostFormProps> = ({ onPublish }) => {
  const { theme } = useTheme(); // Grab active theme name ('dark' or 'light')
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<string | undefined>("### Write your post content here...");
  const [association] = useState<'STUDENT' | 'CLUB'>('STUDENT');
  const [stagedAttachments, setStagedAttachments] = useState<Omit<PostAttachment, 'id' | 'postId'>[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [pastedUrl, setPastedUrl] = useState('');
  const [pasteType, setPasteType] = useState<'PHOTO' | 'VIDEO' | 'LINK'>('PHOTO');

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const cleanTag = tagInput.trim().replace(/#/g, '').toLowerCase();
      if (cleanTag && !tags.includes(cleanTag)) setTags([...tags, cleanTag]);
      setTagInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content?.trim()) return;
    onPublish(title, content, association, stagedAttachments, tags);
    setTitle('');
    setContent('### Write your post content here...');
    setStagedAttachments([]);
    setTags([]);
  };

  return (
    // REFACTORED: Swapped custom colors out for central theme language utilities
    <div className="bg-card border border-customBorder p-6 rounded-xl space-y-6 w-full transition-colors duration-200">
      <h2 className="text-sm font-bold text-subText uppercase tracking-widest border-b border-customBorder pb-2">Create New Post</h2>
      
      <div className="space-y-4">
        <input 
          className="w-full bg-primary border border-customBorder rounded-lg px-4 py-3 text-mainText focus:border-accent outline-none text-sm transition-colors" 
          placeholder="Post Title..." 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
        />

        {/* Dynamic MD editor switching mode natively */}
        <div data-color-mode={theme} className="rounded-lg overflow-hidden border border-customBorder">
          <Suspense fallback={<div className="w-full h-64 bg-primary flex items-center justify-center text-xs text-subText font-mono">Mounting Workspace...</div>}>
            <MDEditor value={content} onChange={setContent} preview="edit" height={240} />
          </Suspense>
        </div>

        {/* Tags Block */}
        <div className="space-y-2">
          <label className="text-[10px] text-subText uppercase font-bold block">Categorization Tags</label>
          <input 
            type="text" 
            placeholder="Type tag and press Enter..." 
            value={tagInput} 
            onChange={e => setTagInput(e.target.value)} 
            onKeyDown={handleTagKeyDown} 
            className="w-full bg-primary border border-customBorder rounded-lg px-3 py-2 text-xs text-mainText outline-none focus:border-slate-500 transition-colors" 
          />
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map((tag, i) => (
                <span key={i} className="inline-flex items-center text-[10px] bg-primary text-subText px-2 py-0.5 rounded border border-customBorder font-mono">
                  #{tag}
                  <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))} className="ml-1 text-subText hover:text-rose-500 cursor-pointer"><X className="w-2.5 h-2.5" /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Link Aggregator Container */}
        <div className="bg-primary p-4 rounded-lg border border-customBorder space-y-4 transition-colors">
          <div className="space-y-2">
            <label className="text-[10px] text-subText uppercase font-bold block">Inject Web URLs / Reference Links</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <select value={pasteType} onChange={e => setPasteType(e.target.value as any)} className="bg-card text-xs text-mainText p-2 rounded outline-none border border-customBorder">
                <option value="PHOTO">Photo URL</option>
                <option value="VIDEO">Video URL</option>
                <option value="LINK">Reference Link</option>
              </select>
              <input className="flex-1 bg-card border border-customBorder rounded px-3 py-1.5 text-xs text-mainText outline-none" placeholder="Paste link destination address..." value={pastedUrl} onChange={e => setPastedUrl(e.target.value)} />
              <button type="button" onClick={() => {}} className="p-2 bg-accent text-primary rounded hover:bg-accentHover font-bold flex justify-center cursor-pointer"><Plus className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        <button onClick={handleSubmit} className="w-full bg-accent text-primary py-3 rounded-lg font-black uppercase tracking-widest hover:bg-accentHover transition-colors flex items-center justify-center gap-2 text-xs cursor-pointer shadow-md">
          <Send className="w-4 h-4" /> Dispatch Post
        </button>
      </div>
    </div>
  );
};