import React, { useState, useRef, Suspense } from 'react';
import { Send, Plus, Trash2, X, Image, Video, Link as LinkIcon, UploadCloud, Loader2 } from 'lucide-react';
import type { PostAttachment } from '../../interfaces/post.type';
import { useTheme } from '../../context/ThemeContext';

const MDEditor = React.lazy(() => import('@uiw/react-md-editor'));

interface PostFormProps {
  // Pass identifying attributes directly into the form instead of returning up
  eventId: string;
  clubName: string;
  
  // Explicit close handler to notify parent modal view wrapper to unmount/hide
  onClose: () => void;
  modalTitle?: string;
  // Feature toggle flags
  isImageInput?: boolean;
  isVideoInput?: boolean;
  isTags?: boolean;
}

export const PostForm: React.FC<PostFormProps> = ({ 
  eventId,
  clubName,
  onClose,
  isImageInput = true,
  isVideoInput = true,
  modalTitle,
  isTags = true
}) => {
  const { theme } = useTheme(); 
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Core Form Input Variables
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<string | undefined>("### Write your post content here...");
  const [stagedAttachments, setStagedAttachments] = useState<Omit<PostAttachment, 'id' | 'postId'>[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
   
  // Explicit Text Link Pasting Controls
  const defaultPasteType = isImageInput ? 'PHOTO' : (isVideoInput ? 'VIDEO' : 'LINK');
  const [pasteType, setPasteType] = useState<'PHOTO' | 'VIDEO' | 'LINK'>(defaultPasteType);
  const [pastedUrl, setPastedUrl] = useState('');

  // Execution Process Loading Trackers
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine if attachment functionality is needed at all
  const showAttachmentsSection = isImageInput || isVideoInput;

  // ----------------------------------------------------------------
  // 🔍 AUTOMATED EXTENSION / MIME CLASSIFIER MATRIX
  // ----------------------------------------------------------------
  const detectAttachmentType = (fileName: string): 'PHOTO' | 'VIDEO' | 'LINK' => {
    const cleanName = fileName.trim().toLowerCase();
    const ext = cleanName.split('.').pop() || '';
    
    const photoExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp'];
    const videoExtensions = ['mp4', 'mov', 'avi', 'webm', 'mkv', '3gp'];

    if (isImageInput && photoExtensions.includes(ext)) return 'PHOTO';
    if (isVideoInput && videoExtensions.includes(ext)) return 'VIDEO';
    return 'LINK'; 
  };

  const handleAddPastedLink = () => {
    const targetUrl = pastedUrl.trim();
    if (!targetUrl) return;

    const newAttachment: Omit<PostAttachment, 'id' | 'postId'> = {
      type: pasteType, 
      url: targetUrl,
    };

    setStagedAttachments((prev) => [...prev, newAttachment]);
    setPastedUrl('');
  };

  const handleLocalDummyUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    setTimeout(() => {
      const simulatedAttachments = Array.from(files)
        .map((file) => {
          const localMemoryUrl = URL.createObjectURL(file);
          const derivedType = detectAttachmentType(file.name);

          return {
            type: derivedType,
            url: localMemoryUrl
          };
        })
        .filter(attachment => {
          if (attachment.type === 'PHOTO' && !isImageInput) return false;
          if (attachment.type === 'VIDEO' && !isVideoInput) return false;
          return true;
        });

      setStagedAttachments((prev) => [...prev, ...simulatedAttachments]);
      setIsUploading(false);

      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 600); 
  };

  const handleRemoveAttachment = (indexToRemove: number) => {
    setStagedAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isTags) return;
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const cleanTag = tagInput.trim().replace(/#/g, '').toLowerCase();
      if (cleanTag && !tags.includes(cleanTag)) setTags([...tags, cleanTag]);
      setTagInput('');
    }
  };

  // ----------------------------------------------------------------
  // 🚀 SELF-CONTAINED SUBMISSION HANDLER
  // ----------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content?.trim() || isSubmitting) return;
    
    setIsSubmitting(true);

    try {
      // 1. Clear array allocations conditionally if props restrict feature space
      const finalTags = isTags ? tags : [];
      const finalAttachments = showAttachmentsSection ? stagedAttachments : [];
      
      // 2. Transpile dynamic media elements arrays into explicit announcement targets
      const primaryMedia = finalAttachments.find(a => a.type === 'PHOTO' || a.type === 'VIDEO');
      const standardInformationalLink = finalAttachments.find(a => a.type === 'LINK');

      // Synthesize structural markdown text stream payload
      let synthesizedContent = `### ${title}\n\n${content}`;
      if (finalTags.length > 0) {
        synthesizedContent += `\n\n**Tags:** ${finalTags.map(t => `#${t}`).join(' ')}`;
      }

      // 3. Construct Unified Target JSON Request Body Interface payload data
      const outPayload = {
        targetEventId: eventId,
        authorName: clubName,
        contentMarkdown: synthesizedContent,
        mediaAssetUrl: primaryMedia ? primaryMedia.url : null,
        referenceLink: standardInformationalLink ? {
          label: "External Reference",
          url: standardInformationalLink.url
        } : null
      };

      /**
       * 🌐 ASYNCHRONOUS DATABASE TRANSMISSION PIPELINE
       * Replace this block or axios placeholder directly with your actual application API hook calls
       * e.g., await api.post(`/events/${eventId}/announcements`, outPayload);
       */
      console.log("Transmitting autonomous self-contained data payload to network:", outPayload);
      
      // Artificial delay simulation to show layout progression state UI properly
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 4. Form internal variable scrub/reset operation 
      setTitle('');
      setContent('### Write your post content here...');
      setStagedAttachments([]);
      setTags([]);

      // 5. Fire parent view controller visibility toggle callback close handler natively
      onClose();

    } catch (error) {
      console.error("Critical submission disruption caught:", error);
      alert("Failed to securely store announcement changes. Please inspect active data shapes.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAttachmentIcon = (type: 'PHOTO' | 'VIDEO' | 'LINK') => {
    switch (type) {
      case 'PHOTO': return <Image className="w-3.5 h-3.5 text-emerald-400" />;
      case 'VIDEO': return <Video className="w-3.5 h-3.5 text-blue-400" />;
      case 'LINK': return <LinkIcon className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  const getAcceptedFileTypes = () => {
    const accepted: string[] = [];
    if (isImageInput) accepted.push('image/*');
    if (isVideoInput) accepted.push('video/*');
    return accepted.join(',');
  };

  return (
    <div className="bg-card border border-customBorder p-6 rounded-xl space-y-6 w-full transition-colors duration-200">
      <div className="flex justify-between items-center border-b border-customBorder pb-2">
        <h2 className="text-sm font-bold text-subText uppercase tracking-widest">
          {modalTitle ? modalTitle : 'Submit the Form'}
        </h2>
        {/* Upper right explicit close action utility element */}
        <button 
          type="button" 
          onClick={onClose} 
          disabled={isSubmitting}
          className="p-1 text-subText hover:text-mainText rounded hover:bg-primary transition-colors cursor-pointer disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-4">
        {/* Title Input field */}
        <input 
          disabled={isSubmitting}
          className="w-full bg-primary border border-customBorder rounded-lg px-4 py-3 text-mainText focus:border-accent outline-none text-sm transition-colors disabled:opacity-60" 
          placeholder="Title..." 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
        />

        {/* MD Editor Surface Area Workspace */}
        <div data-color-mode={theme} className="rounded-lg overflow-hidden border border-customBorder">
          <Suspense fallback={<div className="w-full h-64 bg-primary flex items-center justify-center text-xs text-subText font-mono">Mounting Workspace...</div>}>
            <MDEditor value={content} onChange={setContent} preview="edit" height={240} />
          </Suspense>
        </div>

        {/* Tags Block - Conditionally Rendered */}
        {isTags && (
          <div className="space-y-2">
            <label className="text-[10px] text-subText uppercase font-bold block">Categorization Tags</label>
            <input 
              disabled={isSubmitting}
              type="text" 
              placeholder="Type tag and press Enter..." 
              value={tagInput} 
              onChange={e => setTagInput(e.target.value)} 
              onKeyDown={handleTagKeyDown} 
              className="w-full bg-primary border border-customBorder rounded-lg px-3 py-2 text-xs text-mainText outline-none focus:border-slate-500 transition-colors disabled:opacity-60" 
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((tag, i) => (
                  <span key={i} className="inline-flex items-center text-[10px] bg-primary text-subText px-2 py-0.5 rounded border border-customBorder font-mono">
                    #{tag}
                    <button type="button" disabled={isSubmitting} onClick={() => setTags(tags.filter(t => t !== tag))} className="ml-1 text-subText hover:text-rose-500 cursor-pointer disabled:opacity-30">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Asset Manager Sub-system */}
        {showAttachmentsSection && (
          <div className="bg-primary p-4 rounded-lg border border-customBorder space-y-4 transition-colors">
            <div className="space-y-2">
              <label className="text-[10px] text-subText uppercase font-bold block">Option A: Paste External Target Web URL</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <select 
                  disabled={isSubmitting}
                  value={pasteType} 
                  onChange={e => setPasteType(e.target.value as any)} 
                  className="bg-card text-xs text-mainText p-2 rounded outline-none border border-customBorder disabled:opacity-60"
                >
                  {isImageInput && <option value="PHOTO">Photo Link</option>}
                  {isVideoInput && <option value="VIDEO">Video Link</option>}
                  <option value="LINK">Reference Document / Tab Link</option>
                </select>
                
                <input 
                  disabled={isSubmitting}
                  className="flex-1 bg-card border border-customBorder rounded px-3 py-1.5 text-xs text-mainText outline-none focus:border-slate-500 transition-colors disabled:opacity-60" 
                  placeholder="https://example.com/assets/file.png" 
                  value={pastedUrl} 
                  onChange={e => setPastedUrl(e.target.value)} 
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddPastedLink(); } }}
                />
                
                <button 
                  type="button" 
                  disabled={isSubmitting}
                  onClick={handleAddPastedLink} 
                  className="p-2 bg-accent text-primary rounded hover:bg-accentHover font-bold flex justify-center cursor-pointer transition-colors disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-customBorder/40">
              <label className="text-[10px] text-subText uppercase font-bold block">Option B: Drag & Select Local System Files</label>
              <input 
                type="file" 
                ref={fileInputRef}
                multiple 
                accept={getAcceptedFileTypes()}
                className="hidden" 
                onChange={handleLocalDummyUpload} 
              />
              <button
                type="button"
                disabled={isUploading || isSubmitting}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full py-3 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-all group ${
                  isUploading || isSubmitting 
                    ? 'border-accent/40 bg-card/40 cursor-not-allowed text-subText' 
                    : 'border-customBorder hover:border-accent bg-card cursor-pointer'
                }`}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center gap-1">
                    <Loader2 className="w-5 h-5 text-accent animate-spin" />
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-accent animate-pulse">Generating Assets...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-mainText group-hover:text-accent transition-colors">
                      <UploadCloud className="w-4 h-4 text-subText group-hover:text-accent" />
                      <span>Upload Local Assets</span>
                    </div>
                  </div>
                )}
              </button>
            </div>

            {stagedAttachments.length > 0 && (
              <div className="pt-2 border-t border-customBorder/60 space-y-1.5">
                <span className="text-[9px] font-mono font-bold text-subText uppercase tracking-wider block">Staged Media Pipeline Queue ({stagedAttachments.length})</span>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {stagedAttachments.map((attachment, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-card border border-customBorder p-2 rounded text-[11px]">
                      <div className="flex items-center gap-2 min-w-0 pr-4">
                        {getAttachmentIcon(attachment.type)}
                        <span className="font-mono text-mainText truncate max-w-xs" title={attachment.url}>{attachment.url}</span>
                      </div>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleRemoveAttachment(idx)}
                        className="text-subText hover:text-rose-500 p-1 rounded transition-colors cursor-pointer disabled:opacity-30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Primary Dispatch Action Submission Execution Button */}
        <button 
          onClick={handleSubmit} 
          disabled={isUploading || isSubmitting || !title.trim()}
          className={`w-full text-primary py-3 rounded-lg font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 text-xs shadow-md ${
            isUploading || isSubmitting || !title.trim()
              ? 'bg-accent/40 cursor-not-allowed opacity-75 text-primary/60' 
              : 'bg-accent hover:bg-accentHover cursor-pointer active:scale-[0.99]'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Dismitting Elements Node...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" /> Finalize & Dispatch
            </>
          )}
        </button>
      </div>
    </div>
  );
};