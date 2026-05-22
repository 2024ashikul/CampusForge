import React, { useState, Suspense } from 'react';
import { 
  MessageSquare, Play, FileText, Download, ExternalLink, 
  Hash, ThumbsUp, ThumbsDown, Star, Send, CornerDownRight,
  Image, Video, Link as LinkIcon
} from 'lucide-react';
import type { PostData, PostComment, ReactionType, CommentReactionType, PostAttachment } from '../../interfaces/post.type';
import { useTheme } from '../../context/ThemeContext';

const MarkdownPreview = React.lazy(() => 
  import('@uiw/react-md-editor').then((mod) => ({ default: mod.default.Markdown }))
);

type PostReactionsMap = Record<string, ReactionType>;

export const PostCard: React.FC<{ postData: PostData }> = ({ postData }) => {
  const CURRENT_USER_ID = 'u-current-user'; 
  const { theme } = useTheme(); 
  
  const [comments, setComments] = useState<PostComment[]>(postData.comments);
  const [reactions, setReactions] = useState<PostReactionsMap>(postData.reactions || {});
  const [isCommentBoxOpen, setIsCommentBoxOpen] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const reactionValues = Object.values(reactions);
  const totalLikes = reactionValues.filter(r => r === 'LIKE').length;
  const totalDislikes = reactionValues.filter(r => r === 'DISLIKE').length;
  const totalStars = reactionValues.filter(r => r === 'STAR').length;
  const currentUserReaction = reactions[CURRENT_USER_ID];

  const handleReactionClick = (clickedType: ReactionType) => {
    setReactions(prev => {
      const next = { ...prev };
      if (next[CURRENT_USER_ID] === clickedType) { delete next[CURRENT_USER_ID]; } 
      else { next[CURRENT_USER_ID] = clickedType; }
      return next;
    });
  };

  const handleCommentReactionClick = (commentId: string, type: CommentReactionType) => {
    setComments(prev => prev.map(c => {
      if (c.id !== commentId) return c;
      const updated = { ...c.reactions };
      if (updated[CURRENT_USER_ID] === type) { delete updated[CURRENT_USER_ID]; } 
      else { updated[CURRENT_USER_ID] = type; }
      return { ...c, reactions: updated };
    }));
  };

  const handleAddRootComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    setComments([...comments, {
      id: `comment-${Date.now()}`,
      postId: postData.id,
      parentId: null,
      authorName: 'Alex Rivera',
      authorAvatar: '👨‍💻',
      content: newCommentText.trim(),
      createdAt: 'Just now',
      reactions: {}
    }]);
    setNewCommentText('');
  };

  const handleAddReply = (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setComments([...comments, {
      id: `reply-${Date.now()}`,
      postId: postData.id,
      parentId: parentId,
      authorName: 'Alex Rivera',
      authorAvatar: '👨‍💻',
      content: replyText.trim(),
      createdAt: 'Just now',
      reactions: {}
    }]);
    setReplyText('');
    setActiveReplyId(null);
  };

  const rootComments = comments.filter(c => c.parentId === null);
  const getRepliesForParent = (parentId: string) => comments.filter(c => c.parentId === parentId);
  const getCommentMetrics = (commentReactions: any) => {
    const values = Object.values(commentReactions || {});
    return {
      likes: values.filter(v => v === 'LIKE').length,
      dislikes: values.filter(v => v === 'DISLIKE').length,
      userChoice: commentReactions?.[CURRENT_USER_ID] || null
    };
  };

  const getCleanFileName = (url: string) => {
    try {
      const decodedUrl = decodeURIComponent(url);
      if (decodedUrl.startsWith('blob:')) return "Staged Local System File Asset";
      return decodedUrl.split('/').pop()?.split('?')[0] || "Download Reference Link Package";
    } catch {
      return "Download Reference Link Package";
    }
  };

  // ----------------------------------------------------------------
  // 📺 YOUTUBE LINK TRANSLATION AND EXTRACTION PARSER
  // ----------------------------------------------------------------
  const getYouTubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    
    // Regular expression tracking rules for standard, shared, short, and embed urls
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
      const videoId = match[2];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    return null;
  };

  return (
    <div className="bg-card border border-customBorder rounded-xl overflow-hidden shadow-xl mb-6 w-full transition-all duration-200">
      
      {/* Identity Header */}
      <div className="p-5 pb-3 flex items-center justify-between border-b border-customBorder/30">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-primary border border-customBorder flex items-center justify-center text-sm transition-colors">
            {postData.author.avatar}
          </div>
          <div>
            <h3 className="text-sm font-bold text-mainText transition-colors">{postData.author.name}</h3>
            <p className="text-xs text-subText mt-0.5 transition-colors">
              {postData.author.roleTitle} • {postData.createdAt}
            </p>
          </div>
        </div>
        <div className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary text-subText border border-customBorder uppercase tracking-widest">
          {postData.author.association}
        </div>
      </div>

      {/* Content Frame Workspace */}
      <div className="p-5 space-y-4">
        <h2 className="text-lg font-black text-mainText transition-colors">{postData.title}</h2>
        
        {/* Markdown Content Rendering Panel */}
        <div data-color-mode={theme} className="min-h-[1rem]">
          <Suspense fallback={<p className="text-xs text-subText font-mono">Parsing content stream...</p>}>
            <MarkdownPreview source={postData.markdownContent} className="!bg-transparent !text-mainText text-sm" />
          </Suspense>
        </div>

        {/* Tags UI Layout Sub-Component */}
        {postData.tags && postData.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {postData.tags.map((tag, idx) => (
              <span key={idx} className="inline-flex items-center text-[11px] font-medium bg-primary text-accent px-2 py-0.5 rounded border border-customBorder">
                <Hash className="w-3 h-3 mr-0.5 opacity-60" /> {tag}
              </span>
            ))}
          </div>
        )}

        {/* ================================================================ */}
        {/* 🛠️ ASSET RENDERING ENGINE LAYER WITH INTEGRATED YOUTUBE INTERCEPT */}
        {/* ================================================================ */}
        {postData.attachments && postData.attachments.length > 0 && (
          <div className="pt-4 border-t border-customBorder/40 space-y-4">
            
            {/* Split Media Processing Loop (Photos & Videos Container Grid) */}
            {postData.attachments.some(a => a.type === 'PHOTO' || a.type === 'VIDEO') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {postData.attachments
                  .filter(asset => asset.type === 'PHOTO' || asset.type === 'VIDEO')
                  .map((asset, index) => {
                    const youtubeEmbedUrl = asset.type === 'VIDEO' ? getYouTubeEmbedUrl(asset.url) : null;

                    return (
                      <div 
                        key={index} 
                        className="relative bg-primary border border-customBorder rounded-xl overflow-hidden group shadow-sm flex items-center justify-center min-h-[200px] max-h-80 w-full"
                      >
                        {asset.type === 'PHOTO' ? (
                          <img 
                            src={asset.url} 
                            alt="Post attachment asset graphic" 
                            className="w-full h-full object-cover max-h-80 transition-transform duration-300 group-hover:scale-[1.02]"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-black relative flex items-center justify-center aspect-video max-h-80">
                            {youtubeEmbedUrl ? (
                              /* 📺 IF YOUTUBE LINK IS PRESENT: Render Responsive Embedded Frame Workspace */
                              <iframe
                                src={youtubeEmbedUrl}
                                title="YouTube video attachment player container"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                                className="w-full h-full absolute inset-0"
                              />
                            ) : (
                              /* 💾 IF DIRECT VIDEO STREAM: Render Native HTML5 Video Node Player */
                              <video 
                                src={asset.url} 
                                controls 
                                preload="metadata"
                                className="w-full max-h-80 object-contain"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Split Attachment Document Link Loop (PDFs, Archives, Links Card List) */}
            {postData.attachments.some(a => a.type === 'LINK') && (
              <div className="space-y-2">
                <span className="text-[9px] font-mono font-bold text-subText uppercase tracking-wider block">
                  Reference Documentation Attachments
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {postData.attachments
                    .filter(asset => asset.type === 'LINK')
                    .map((asset, index) => (
                      <a 
                        key={index}
                        href={asset.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-primary hover:bg-primary/80 border border-customBorder hover:border-accent/40 rounded-xl transition-all group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div className="w-8 h-8 rounded-lg bg-card border border-customBorder flex items-center justify-center shrink-0 group-hover:text-accent transition-colors">
                            <FileText className="w-4 h-4 text-subText group-hover:text-accent" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-mainText truncate transition-colors group-hover:text-accent">
                              {getCleanFileName(asset.url)}
                            </p>
                            <span className="text-[10px] text-subText block truncate font-mono tracking-tight max-w-[180px] sm:max-w-[240px]">
                              {asset.url}
                            </span>
                          </div>
                        </div>
                        <div className="text-subText group-hover:text-accent transition-colors p-1">
                          {asset.url.startsWith('blob:') ? (
                            <Download className="w-3.5 h-3.5" />
                          ) : (
                            <ExternalLink className="w-3.5 h-3.5" />
                          )}
                        </div>
                      </a>
                    ))}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Engagement Action Operations Row */}
      <div className="px-5 py-3 bg-footer border-t border-customBorder flex flex-wrap items-center justify-between gap-3 transition-colors">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleReactionClick('LIKE')} 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${currentUserReaction === 'LIKE' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-primary border-customBorder text-subText hover:text-mainText'}`}
          >
            <ThumbsUp className="w-3.5 h-3.5" /> {totalLikes}
          </button>
          <button 
            onClick={() => handleReactionClick('DISLIKE')} 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${currentUserReaction === 'DISLIKE' ? 'bg-rose-500/10 border-rose-500 text-rose-400' : 'bg-primary border-customBorder text-subText hover:text-mainText'}`}
          >
            <ThumbsDown className="w-3.5 h-3.5" /> {totalDislikes}
          </button>
          <button 
            onClick={() => handleReactionClick('STAR')} 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${currentUserReaction === 'STAR' ? 'bg-amber-500/10 border-amber-500 text-amber-400' : 'bg-primary border-customBorder text-subText hover:text-mainText'}`}
          >
            <Star className={`w-3.5 h-3.5 ${currentUserReaction === 'STAR' ? 'fill-current' : ''}`} /> {totalStars}
          </button>
        </div>

        <button 
          onClick={() => setIsCommentBoxOpen(!isCommentBoxOpen)} 
          className={`text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${isCommentBoxOpen ? 'text-accent' : 'text-subText hover:text-accent'}`}
        >
          <MessageSquare className="w-4 h-4" /> {comments.length} Discussion Tree
        </button>
      </div>

      {/* REDESIGNED COMMENT WORKSPACE DRAWER */}
      {isCommentBoxOpen && (
        <div className="bg-primary/40 border-t border-customBorder p-5 space-y-6 transition-colors">
          <div className="space-y-5 max-h-[420px] overflow-y-auto pr-2">
            {rootComments.length > 0 ? (
              rootComments.map(root => {
                const childReplies = getRepliesForParent(root.id);
                const rootMetrics = getCommentMetrics(root.reactions);
                return (
                  <div key={root.id} className="space-y-3 relative">
                    {/* Parent Comment Component Box */}
                    <div className="bg-card p-4 rounded-xl border border-customBorder shadow-md transition-colors">
                      <div className="flex gap-3 items-start">
                        <div className="text-sm shrink-0 w-8 h-8 rounded-lg bg-primary border border-customBorder flex items-center justify-center">
                          {root.authorAvatar}
                        </div>
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-mainText">{root.authorName}</span>
                            <span className="text-[9px] text-subText font-mono bg-primary px-1.5 py-0.5 rounded border border-customBorder">
                              {root.createdAt}
                            </span>
                          </div>
                          <p className="text-xs text-mainText pl-0.5">{root.content}</p>
                          <div className="flex items-center justify-between pt-2 border-t border-customBorder/40 mt-2">
                            <div className="flex items-center gap-1 bg-primary p-0.5 rounded-md border border-customBorder">
                              <button onClick={() => handleCommentReactionClick(root.id, 'LIKE')} className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${rootMetrics.userChoice === 'LIKE' ? 'text-emerald-400' : 'text-subText hover:text-mainText'}`}><ThumbsUp className="w-2.5 h-2.5" />{rootMetrics.likes}</button>
                              <button onClick={() => handleCommentReactionClick(root.id, 'DISLIKE')} className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${rootMetrics.userChoice === 'DISLIKE' ? 'text-rose-400' : 'text-subText hover:text-mainText'}`}><ThumbsDown className="w-2.5 h-2.5" />{rootMetrics.dislikes}</button>
                            </div>
                            <button onClick={() => { setActiveReplyId(activeReplyId === root.id ? null : root.id); setReplyText(''); }} className="text-[10px] font-black uppercase text-subText hover:text-accent cursor-pointer">Reply</button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Nested Child Branch Loops */}
                    {childReplies.map(reply => {
                      const replyMetrics = getCommentMetrics(reply.reactions);
                      return (
                        <div key={reply.id} className="flex gap-2.5 pl-7 items-start">
                          <CornerDownRight className="w-3.5 h-3.5 text-subText mt-2 shrink-0 opacity-40" />
                          <div className="flex-1 bg-card/60 border border-customBorder p-3.5 rounded-xl flex gap-3 items-start shadow-sm transition-colors">
                            <div className="text-xs shrink-0 w-7 h-7 rounded-lg bg-primary border border-customBorder flex items-center justify-center">
                              {reply.authorAvatar}
                            </div>
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-mainText">{reply.authorName}</span>
                                <span className="text-[9px] text-subText font-mono">{reply.createdAt}</span>
                              </div>
                              <p className="text-xs text-subText">{reply.content}</p>
                              <div className="flex items-center gap-1 bg-primary p-0.5 rounded-md border border-customBorder w-max mt-2">
                                <button onClick={() => handleCommentReactionClick(reply.id, 'LIKE')} className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer ${replyMetrics.userChoice === 'LIKE' ? 'text-emerald-400' : 'text-subText'}`}><ThumbsUp className="w-2.5 h-2.5" />{replyMetrics.likes}</button>
                                <button onClick={() => handleCommentReactionClick(reply.id, 'DISLIKE')} className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold cursor-pointer ${replyMetrics.userChoice === 'DISLIKE' ? 'text-rose-400' : 'text-subText'}`}><ThumbsDown className="w-2.5 h-2.5" />{replyMetrics.dislikes}</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Inline Sub-Reply Submission Form */}
                    {activeReplyId === root.id && (
                      <form onSubmit={(e) => handleAddReply(e, root.id)} className="flex items-center gap-2 pl-7 mt-1">
                        <input type="text" placeholder={`Reply to ${root.authorName}...`} value={replyText} onChange={e => setReplyText(e.target.value)} className="flex-1 bg-card border border-customBorder rounded-xl px-3 py-2 text-xs text-mainText outline-none focus:border-accent" />
                        <button type="submit" className="p-2 bg-accent text-primary rounded-xl cursor-pointer"><Send className="w-3.5 h-3.5" /></button>
                      </form>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-subText text-center py-4 font-mono">No conversation logs found.</p>
            )}
          </div>

          {/* Master Base Input Node Element */}
          <form onSubmit={handleAddRootComment} className="flex items-center gap-2 mt-4 pt-4 border-t border-customBorder/60">
            <input type="text" placeholder="Share your insight item..." value={newCommentText} onChange={e => setNewCommentText(e.target.value)} className="flex-1 bg-card border border-customBorder rounded-xl px-4 py-2.5 text-xs text-mainText outline-none focus:border-accent" />
            <button type="submit" className="p-2.5 bg-accent text-primary hover:bg-accentHover rounded-xl flex cursor-pointer transition-all"><Send className="w-4 h-4" /></button>
          </form>
        </div>
      )}
    </div>
  );
};