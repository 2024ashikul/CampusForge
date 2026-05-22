import React, { useState, useRef, Suspense } from 'react';
import { Send, Plus, Trash2, X, Image, Video, Link as LinkIcon, UploadCloud, Loader2 } from 'lucide-react';
import type { PostAttachment } from '../../interfaces/post.type';
import { useTheme } from '../../context/ThemeContext';

const MDEditor = React.lazy(() => import('@uiw/react-md-editor'));

interface PostFormProps {
  onPublish: (
    title: string, 
    markdown: string, 
    association: 'STUDENT' | 'CLUB', 
    attachments: Omit<PostAttachment, 'id' | 'postId'>[], 
    tags: string[]
  ) => void;
}

export const PostForm: React.FC<PostFormProps> = ({ onPublish }) => {
  const { theme } = useTheme(); 
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Core Form Input Variables
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<string | undefined>("### Write your post content here...");
  const [association] = useState<'STUDENT' | 'CLUB'>('STUDENT');
  const [stagedAttachments, setStagedAttachments] = useState<Omit<PostAttachment, 'id' | 'postId'>[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  // Explicit Text Link Pasting Controls
  const [pastedUrl, setPastedUrl] = useState('');
  const [pasteType, setPasteType] = useState<'PHOTO' | 'VIDEO' | 'LINK'>('PHOTO');

  // Simulated Asynchronous Loader State
  const [isUploading, setIsUploading] = useState(false);

  // ----------------------------------------------------------------
  // 🔍 AUTOMATED EXTENSION / MIME CLASSIFIER MATRIX
  // ----------------------------------------------------------------
  const detectAttachmentType = (fileName: string): 'PHOTO' | 'VIDEO' | 'LINK' => {
    const cleanName = fileName.trim().toLowerCase();
    const ext = cleanName.split('.').pop() || '';
    
    const photoExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp'];
    const videoExtensions = ['mp4', 'mov', 'avi', 'webm', 'mkv', '3gp'];

    if (photoExtensions.includes(ext)) return 'PHOTO';
    if (videoExtensions.includes(ext)) return 'VIDEO';
    return 'LINK'; // Safely defaults to reference link layout (e.g. docs, PDFs)
  };

  // ----------------------------------------------------------------
  // 🔗 HANDLER 1: PROCESSING MANUAL REACTION TARGET TEXT LINKS
  // ----------------------------------------------------------------
  const handleAddPastedLink = () => {
    const targetUrl = pastedUrl.trim();
    if (!targetUrl) return;

    const newAttachment: Omit<PostAttachment, 'id' | 'postId'> = {
      type: pasteType, // Respects whatever choice you forced in the dropdown menu
      url: targetUrl,
    };

    setStagedAttachments((prev) => [...prev, newAttachment]);
    setPastedUrl('');
  };

  // ----------------------------------------------------------------
  // 🪐 HANDLER 2: SIMULATED INSTANT DUMMY LOCAL UPLOAD PIPELINE
  // ----------------------------------------------------------------
  const handleLocalDummyUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    // Simulated short timeout block to keep interaction tracking polished
    setTimeout(() => {
      const simulatedAttachments = Array.from(files).map((file) => {
        // Generates a local browser memory blob link representation string
        const localMemoryUrl = URL.createObjectURL(file);
        
        // Dynamically processes the extension type based on the file signature
        const derivedType = detectAttachmentType(file.name);

        return {
          type: derivedType,
          url: localMemoryUrl
        };
      });

      setStagedAttachments((prev) => [...prev, ...simulatedAttachments]);
      setIsUploading(false);

      // Flash storage state flush
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 600); // 600ms realistic interface frame simulation rate
  };

  const handleRemoveAttachment = (indexToRemove: number) => {
    setStagedAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

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
    
    // Total input cleanup action
    setTitle('');
    setContent('### Write your post content here...');
    setStagedAttachments([]);
    setTags([]);
  };

  const getAttachmentIcon = (type: 'PHOTO' | 'VIDEO' | 'LINK') => {
    switch (type) {
      case 'PHOTO': return <Image className="w-3.5 h-3.5 text-emerald-400" />;
      case 'VIDEO': return <Video className="w-3.5 h-3.5 text-blue-400" />;
      case 'LINK': return <LinkIcon className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <div className="bg-card border border-customBorder p-6 rounded-xl space-y-6 w-full transition-colors duration-200">
      <h2 className="text-sm font-bold text-subText uppercase tracking-widest border-b border-customBorder pb-2">
        Create New Post
      </h2>
      
      <div className="space-y-4">
        {/* Title Input field */}
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
                  <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))} className="ml-1 text-subText hover:text-rose-500 cursor-pointer">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ================================================================ */}
        {/* 🛠️ HYBRID ASSET INJECTION STORAGE MANAGEMENT MATRIX */}
        {/* ================================================================ */}
        <div className="bg-primary p-4 rounded-lg border border-customBorder space-y-4 transition-colors">
          
          {/* Sub-Section: Manual Link Entry Controls */}
          <div className="space-y-2">
            <label className="text-[10px] text-subText uppercase font-bold block">Option A: Paste External Target Web URL</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <select 
                value={pasteType} 
                onChange={e => setPasteType(e.target.value as any)} 
                className="bg-card text-xs text-mainText p-2 rounded outline-none border border-customBorder"
              >
                <option value="PHOTO">Photo Link</option>
                <option value="VIDEO">Video Link</option>
                <option value="LINK">Reference Document / Tab Link</option>
              </select>
              
              <input 
                className="flex-1 bg-card border border-customBorder rounded px-3 py-1.5 text-xs text-mainText outline-none focus:border-slate-500 transition-colors" 
                placeholder="https://example.com/assets/image.png" 
                value={pastedUrl} 
                onChange={e => setPastedUrl(e.target.value)} 
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddPastedLink(); } }}
              />
              
              <button 
                type="button" 
                onClick={handleAddPastedLink} 
                className="p-2 bg-accent text-primary rounded hover:bg-accentHover font-bold flex justify-center cursor-pointer transition-colors"
                title="Stage Text URL Link"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-Section: Local Binary Simulation Upload Dropzone Component */}
          <div className="space-y-2 pt-2 border-t border-customBorder/40">
            <label className="text-[10px] text-subText uppercase font-bold block">Option B: Drag & Select Local System Files (Auto-Dummy Links)</label>
            
            <input 
              type="file" 
              ref={fileInputRef}
              multiple 
              accept="image/*,video/*,.pdf,.zip,.rar,.doc,.docx,.xls,.xlsx"
              className="hidden" 
              onChange={handleLocalDummyUpload} 
            />

            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full py-3 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-all group ${
                isUploading 
                  ? 'border-accent bg-card/40 cursor-not-allowed text-subText' 
                  : 'border-customBorder hover:border-accent bg-card cursor-pointer'
              }`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-1">
                  <Loader2 className="w-5 h-5 text-accent animate-spin" />
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-accent animate-pulse">
                    Generating Local Mock Asset Links...
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-mainText group-hover:text-accent transition-colors">
                    <UploadCloud className="w-4 h-4 text-subText group-hover:text-accent transition-colors" />
                    <span>Upload Local System Assets</span>
                  </div>
                  <span className="text-[10px] text-subText font-medium">
                    Batch select any type — Auto link string will bind directly inside form payload state
                  </span>
                </div>
              )}
            </button>
          </div>

          {/* 👁️ VISUAL INTERACTIVE LAYER: STAGED QUEUE COMPILATION PREVIEW LIST */}
          {stagedAttachments.length > 0 && (
            <div className="pt-2 border-t border-customBorder/60 space-y-1.5">
              <span className="text-[9px] font-mono font-bold text-subText uppercase tracking-wider block">
                Staged Media Pipeline Queue ({stagedAttachments.length})
              </span>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {stagedAttachments.map((attachment, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between bg-card border border-customBorder p-2 rounded text-[11px] animate-fade-in"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-4">
                      {getAttachmentIcon(attachment.type)}
                      <span className="font-mono text-mainText truncate max-w-xs sm:max-w-md" title={attachment.url}>
                        {attachment.url}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      className="text-subText hover:text-rose-500 p-1 rounded transition-colors cursor-pointer"
                      title="Drop Attachment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Form Submission Execution Trigger Button */}
        <button 
          onClick={handleSubmit} 
          disabled={isUploading}
          className={`w-full text-primary py-3 rounded-lg font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 text-xs shadow-md ${
            isUploading 
              ? 'bg-accent/40 cursor-not-allowed opacity-75' 
              : 'bg-accent hover:bg-accentHover cursor-pointer active:scale-[0.99]'
          }`}
        >
          <Send className="w-4 h-4" /> Dispatch Post
        </button>
      </div>
    </div>
  );
};