import React, { useState, useRef, Suspense } from 'react';
import { Send, Plus, Trash2, X, Image, Video, Link as LinkIcon, UploadCloud, Loader2 } from 'lucide-react';
import type { PostAttachment } from '../../interfaces/post.type';
import { useTheme } from '../../context/ThemeContext';
import { createPostApi, uploadFileApi } from '../../services/api';

const MDEditor = React.lazy(() => import('@uiw/react-md-editor'));

interface PostFormProps {
  eventId?: string | number;
  clubName?: string;
  onClose?: () => void;
  modalTitle?: string;
  isImageInput?: boolean;
  isVideoInput?: boolean;
  isTags?: boolean;
  onPublish?: (
    title: string,
    markdown: string,
    association: 'STUDENT' | 'CLUB',
    attachments: Omit<PostAttachment, 'id' | 'postId'>[],
    tags: string[]
  ) => void;
}

export const PostForm: React.FC<PostFormProps> = ({
  eventId,
  clubName = 'Campus Community',
  onClose,
  onPublish,
  isImageInput = true,
  isVideoInput = true,
  modalTitle,
  isTags = true
}) => {
  const { theme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState<string | undefined>("### Write your post content here...");
  const [stagedAttachments, setStagedAttachments] = useState<Omit<PostAttachment, 'id' | 'postId'>[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const defaultPasteType = isImageInput ? 'PHOTO' : (isVideoInput ? 'VIDEO' : 'LINK');
  const [pasteType, setPasteType] = useState<'PHOTO' | 'VIDEO' | 'LINK'>(defaultPasteType);
  const [pastedUrl, setPastedUrl] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'published' | 'draft'>('published');

  const showAttachmentsSection = isImageInput || isVideoInput;

  const detectAttachmentType = (fileName: string): 'PHOTO' | 'VIDEO' | 'FILE' => {
    const cleanName = fileName.trim().toLowerCase();
    const ext = cleanName.split('.').pop() || '';

    const photoExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp'];
    const videoExtensions = ['mp4', 'mov', 'avi', 'webm', 'mkv', '3gp'];

    if (isImageInput && photoExtensions.includes(ext)) return 'PHOTO';
    if (isVideoInput && videoExtensions.includes(ext)) return 'VIDEO';
    return 'FILE';
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

  const handleLocalDummyUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploaded = await Promise.all(Array.from(files).map(async (file) => ({
        type: detectAttachmentType(file.name),
        url: (await uploadFileApi(file)).url,
      })));
      setStagedAttachments((prev) => [...prev, ...uploaded.filter((attachment) =>
        (attachment.type !== 'PHOTO' || isImageInput) &&
        (attachment.type !== 'VIDEO' || isVideoInput)
      )]);
    } catch (error) {
      console.error('Post attachment upload failed:', error);
      alert(error instanceof Error ? error.message : 'Could not upload the selected file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
  // FIXED SUBMISSION HANDLER - MATCHES POSTCREATE PYDANTIC SCHEMA
  // ----------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content?.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const finalTags = isTags ? tags : [];
      const finalAttachments = showAttachmentsSection ? stagedAttachments : [];

      // Form media list for PostMediaSchema
      const formattedMedia = finalAttachments.map((att, idx) => ({
        media_type: att.type.toLowerCase(), // 'photo' | 'video' | 'link'
        file_url: att.url,
        display_order: idx
      }));

      // Convert eventId / clubId to integer or null
      const parsedClubId = eventId && !isNaN(Number(eventId)) ? Number(eventId) : null;

      // Send structure matching PostCreate Pydantic schema
      const payload = {
        title: title.trim(),
        description: content.trim(),
        post_type: "post",
        status: status,
        club_id: parsedClubId,
        tags: finalTags,
        media: formattedMedia
      };

      // Execute API Call
      const createdPost = await createPostApi(payload);

      if (onPublish) {
        onPublish(title, content || '', 'STUDENT', stagedAttachments, finalTags);
      }

      // Reset Form
      setTitle('');
      setContent('### Write your post content here...');
      setStagedAttachments([]);
      setTags([]);

      if (onClose) onClose();

    } catch (error: any) {
      console.error("Critical submission disruption caught:", error.message);
      alert(`Failed to save post:\n${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAttachmentIcon = (type: 'PHOTO' | 'VIDEO' | 'FILE' | 'LINK') => {
    switch (type) {
      case 'PHOTO': return <Image className="w-3.5 h-3.5 text-emerald-400" />;
      case 'VIDEO': return <Video className="w-3.5 h-3.5 text-blue-400" />;
      case 'LINK': return <LinkIcon className="w-3.5 h-3.5 text-amber-400" />;
      case 'FILE': default: return <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  const getAcceptedFileTypes = () => {
    const accepted: string[] = [];
    if (isImageInput) accepted.push('image/*');
    if (isVideoInput) accepted.push('video/*');
    accepted.push('.heic,.heif,.pdf,.doc,.docx,.csv,.xls,.xlsx,.txt,.md');
    return accepted.join(',');
  };

  return (
    <div className="bg-card border border-customBorder p-6 rounded-xl space-y-6 w-full transition-colors duration-200">
      <div className="flex justify-between items-center border-b border-customBorder pb-2">
        <h2 className="text-sm font-bold text-subText uppercase tracking-widest">
          {modalTitle ? modalTitle : 'Submit the Form'}
        </h2>
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
        <input
          disabled={isSubmitting}
          className="w-full bg-primary border border-customBorder rounded-lg px-4 py-3 text-mainText focus:border-accent outline-none text-sm transition-colors disabled:opacity-60"
          placeholder="Title..."
          value={title}
          onChange={e => setTitle(e.target.value)}
        />

        <div data-color-mode={theme} className="rounded-lg overflow-hidden border border-customBorder">
          <Suspense fallback={<div className="w-full h-64 bg-primary flex items-center justify-center text-xs text-subText font-mono">Mounting Workspace...</div>}>
            <MDEditor value={content} onChange={setContent} preview="edit" height={240} />
          </Suspense>
        </div>

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
                className={`w-full py-3 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-all group ${isUploading || isSubmitting
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

        <div className="flex items-center gap-3 text-xs font-bold text-subText">
          <span className="uppercase tracking-wider">Status:</span>
          {([
            { key: 'published' as const, label: 'Publish', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
            { key: 'draft' as const, label: 'Save Draft', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
          ]).map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setStatus(s.key)}
              className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                status === s.key ? s.color : 'border-customBorder text-subText hover:text-mainText'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={isUploading || isSubmitting || !title.trim()}
          className={`w-full text-primary py-3 rounded-lg font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 text-xs shadow-md ${isUploading || isSubmitting || !title.trim()
              ? 'bg-accent/40 cursor-not-allowed opacity-75 text-primary/60'
              : 'bg-accent hover:bg-accentHover cursor-pointer active:scale-[0.99]'
            }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Dispatching...
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
