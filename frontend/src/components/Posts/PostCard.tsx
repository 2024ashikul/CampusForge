import React, { useState, useEffect, Suspense } from 'react';
import {
  MessageSquare, FileText, ExternalLink,
  ThumbsUp, Send, Bookmark, MoreHorizontal, Globe, Flame, Heart, Sparkles, Loader2
} from 'lucide-react';
import type { PostData, PostComment, ReactionType } from '../../interfaces/post.type';
import {
  getCommentsApi, createCommentApi, reactToPostApi, updatePostApi, deletePostApi, publishPostApi, type BackendComment
} from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserAvatar } from '../ui/UserAvatar';

const MarkdownPreview = React.lazy(() =>
  import('@uiw/react-md-editor').then((mod) => ({ default: mod.default.Markdown }))
);

export const PostCard: React.FC<{ postData: PostData }> = ({ postData }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [comments, setComments] = useState<BackendComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isCommentBoxOpen, setIsCommentBoxOpen] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuMessage, setMenuMessage] = useState<string | null>(null);

  // Reaction state initialized from postData
  const [reactionCounts, setReactionCounts] = useState(postData.reactionCounts || {});
  const [userReaction, setUserReaction] = useState<ReactionType | null>(postData.userReaction || null);
  const [isReacting, setIsReacting] = useState(false);

    const totalReactions = Object.values(reactionCounts).reduce((acc: number, count) => acc + (count || 0), 0);
    const isAuthor = Boolean(user && postData.userId && user.student_id === postData.userId);
  const [commentCount, setCommentCount] = useState(postData.commentCount || 0);

  // Load comments from backend when comment box is opened
  useEffect(() => {
    if (isCommentBoxOpen && postData.rawId) {
      setIsLoadingComments(true);
      getCommentsApi(postData.rawId)
        .then((data) => setComments(data))
        .catch((err) => console.error('[Comments] Failed to fetch comments:', err))
        .finally(() => setIsLoadingComments(false));
    }
  }, [isCommentBoxOpen, postData.rawId]);

  const handleReaction = async (type: ReactionType) => {
    if (!postData.rawId || isReacting) return;
    setIsReacting(true);

    const prevReaction = userReaction;
    const prevCounts = { ...reactionCounts };

    // Optimistic UI update
    if (prevReaction === type) {
      // Toggling off
      setUserReaction(null);
      setReactionCounts({
        ...prevCounts,
        [type]: Math.max(0, (prevCounts[type] || 1) - 1),
      });
    } else {
      // Adding or switching
      setUserReaction(type);
      const updated = { ...prevCounts };
      if (prevReaction) {
        updated[prevReaction] = Math.max(0, (updated[prevReaction] || 1) - 1);
      }
      updated[type] = (updated[type] || 0) + 1;
      setReactionCounts(updated);
    }

    try {
      await reactToPostApi(postData.rawId, type);
    } catch (err) {
      // Rollback on failure
      setUserReaction(prevReaction);
      setReactionCounts(prevCounts);
    } finally {
      setIsReacting(false);
    }
  };

  const handleAddRootComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !postData.rawId) return;

    try {
      const added = await createCommentApi(postData.rawId, {
        content: newCommentText.trim(),
        parent_id: null,
      });
      setComments((prev) => [...prev, added]);
      setCommentCount((count) => count + 1);
      setNewCommentText('');
    } catch (err) {
      console.error('[Comments] Failed to post comment:', err);
    }
  };

  const handleAddReply = async (e: React.FormEvent, parentId: number) => {
    e.preventDefault();
    if (!replyText.trim() || !postData.rawId) return;

    try {
      const added = await createCommentApi(postData.rawId, {
        content: replyText.trim(),
        parent_id: parentId,
      });
      setComments((prev) => [...prev, added]);
      setCommentCount((count) => count + 1);
      setReplyText('');
      setActiveReplyId(null);
    } catch (err) {
      console.error('[Comments] Failed to post reply:', err);
    }
  };

  // Group comments client-side by parent_id (null = root)
  const rootComments = comments.filter((c) => c.parent_id === null);
  const getReplies = (parentId: number) => comments.filter((c) => c.parent_id === parentId);

  const getCleanFileName = (url: string) => {
    try {
      const decodedUrl = decodeURIComponent(url);
      if (decodedUrl.startsWith('blob:')) return 'Staged Asset';
      return decodedUrl.split('/').pop()?.split('?')[0] || 'Download Attachment';
    } catch {
      return 'Download Attachment';
    }
  };

  const getYouTubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return null;
  };

  return (
    <article className="rounded-lg border border-customBorder bg-card mb-4 overflow-hidden font-sans shadow-sm">

      {/* ── Header ── */}
      <div className="px-4 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <UserAvatar name={postData.author.name} src={postData.author.avatar.startsWith('http') ? postData.author.avatar : undefined} className="h-9 w-9 rounded-md border border-accent/20 text-base" textClassName="text-base" />
            <div>
              <div className="flex items-center gap-2">
                <h3
                  onClick={() => postData.clubId ? navigate(`/club/${postData.clubId}`) : postData.userId && navigate(`/profile/${postData.userId}`)}
                  className="text-sm font-bold text-mainText hover:underline cursor-pointer"
                >
                  {postData.author.name}
                </h3>
                {postData.author.association && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 tracking-wide">
                    {postData.author.association}
                  </span>
                )}
              </div>
            <div className="flex items-center gap-1.5 text-[11px] text-subText mt-0.5">
              <span>{postData.createdAt}</span>
              <span>·</span>
              <Globe className="w-3 h-3 text-subText/70" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsBookmarked((b) => !b)}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              isBookmarked ? 'text-amber-400 bg-amber-500/10' : 'text-subText hover:bg-footer'
            }`}
            title="Bookmark Post"
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu((v) => !v)}
              className="p-1.5 rounded-md text-subText hover:bg-footer transition-colors cursor-pointer"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-customBorder rounded-md shadow-xl z-20 py-1">
                {isAuthor && (
                  <>
                    <button
                      onClick={() => {
                        const title = prompt('Edit title:', postData.title);
                        const desc = prompt('Edit description:', postData.markdownContent);
                        if (title || desc) {
                          updatePostApi(postData.rawId, {
                            title: title || postData.title,
                            description: desc || postData.markdownContent,
                          }).then(() => {
                            setMenuMessage('Post updated. Refresh the feed to see the latest version.');
                          }).catch(() => setMenuMessage('Unable to update this post.'));
                        }
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-mainText hover:bg-footer cursor-pointer"
                    >
                      Edit Post
                    </button>
                    <button
                      onClick={() => {
                        publishPostApi(postData.rawId).then(() => setMenuMessage('Post published.')).catch(() => setMenuMessage('Unable to publish this post.')).finally(() => setShowMenu(false));
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-emerald-400 hover:bg-footer cursor-pointer"
                    >
                      Publish
                    </button>
                    <button
                      onClick={() => {
                        updatePostApi(postData.rawId, { status: 'draft' }).then(() => setMenuMessage('Saved as a draft.')).catch(() => setMenuMessage('Unable to save the draft.')).finally(() => setShowMenu(false));
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-amber-400 hover:bg-footer cursor-pointer"
                    >
                      Save as Draft
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Delete this post?')) {
                          deletePostApi(postData.rawId).then(() => setMenuMessage('Post deleted. Refresh the feed to remove it.')).catch(() => setMenuMessage('Unable to delete this post.')).finally(() => setShowMenu(false));
                        }
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-footer cursor-pointer"
                    >
                      Delete
                    </button>
                  </>
                )}
                {!isAuthor && (
                  <button
                    onClick={() => { setMenuMessage('Report received. Thanks for helping keep CampusForge safe.'); setShowMenu(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-subText hover:bg-footer cursor-pointer"
                  >
                    Report
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {menuMessage && <div className="mx-4 mb-2 rounded-md bg-footer px-3 py-2 text-[11px] text-subText border border-customBorder">{menuMessage}</div>}

      {/* ── Content ── */}
      <div className="px-4 pb-4 space-y-2">
        <h2 className="text-[15px] font-semibold text-mainText leading-snug">{postData.title}</h2>

        <div data-color-mode={theme} className="text-sm leading-relaxed text-mainText">
          <Suspense fallback={<p className="text-xs text-subText animate-pulse">Loading post...</p>}>
            <MarkdownPreview
              source={postData.markdownContent}
              className="!bg-transparent !text-mainText text-sm leading-relaxed"
            />
          </Suspense>
        </div>

        {postData.tags && postData.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {postData.tags.map((tag, idx) => (
              <span key={idx} className="text-[11px] text-accent font-medium hover:underline cursor-pointer">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Media / Attachments ── */}
      {postData.attachments && postData.attachments.length > 0 && (
        <div className="mt-2 space-y-2">
          {postData.attachments.some((a) => a.type === 'PHOTO' || a.type === 'VIDEO') && (
            <div
              className={`grid gap-1 ${
                postData.attachments.filter((a) => a.type === 'PHOTO' || a.type === 'VIDEO').length === 1
                  ? 'grid-cols-1'
                  : 'grid-cols-2'
              }`}
            >
              {postData.attachments
                .filter((asset) => asset.type === 'PHOTO' || asset.type === 'VIDEO')
                .map((asset, index) => {
                  const youtubeEmbedUrl = asset.type === 'VIDEO' ? getYouTubeEmbedUrl(asset.url) : null;
                  return (
                    <div key={index} className="relative bg-black flex items-center justify-center max-h-96 overflow-hidden">
                      {asset.type === 'PHOTO' ? (
                        <img
                          src={asset.url}
                          alt="Attachment"
                          className="w-full h-full object-cover max-h-96"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full aspect-video max-h-96">
                          {youtubeEmbedUrl ? (
                            <iframe
                              src={youtubeEmbedUrl}
                              title="Video"
                              frameBorder="0"
                              allowFullScreen
                              className="w-full h-full"
                            />
                          ) : (
                            <video src={asset.url} controls className="w-full max-h-96 object-contain" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}

          {postData.attachments.some((a) => a.type === 'LINK' || a.type === 'FILE') && (
            <div className="px-4 space-y-1.5">
              {postData.attachments
                .filter((asset) => asset.type === 'LINK' || asset.type === 'FILE')
                .map((asset, index) => (
                  <a
                    key={index}
                    href={asset.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-footer border border-customBorder rounded-md hover:border-accent/40 transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-accent shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-mainText truncate">{getCleanFileName(asset.url)}</p>
                        <span className="text-[10px] text-subText truncate block">{asset.url}</span>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-subText shrink-0" />
                  </a>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ── Reaction Summary Line ── */}
      <div className="px-4 py-2.5 flex items-center justify-between text-xs text-subText border-y border-customBorder/60 bg-footer/35">
        <div className="flex items-center gap-2">
          {totalReactions > 0 ? (
            <div className="flex items-center gap-1">
              {reactionCounts.like ? <span className="text-xs">👍</span> : null}
              {reactionCounts.heart ? <span className="text-xs">❤️</span> : null}
              {reactionCounts.fire ? <span className="text-xs">🔥</span> : null}
              {reactionCounts.clap ? <span className="text-xs">👏</span> : null}
              <span className="font-semibold text-mainText/90 ml-1">{totalReactions}</span>
            </div>
          ) : (
            <span className="text-[11px] text-subText/60">Be the first to react</span>
          )}
        </div>
        <button
          onClick={() => setIsCommentBoxOpen((o) => !o)}
          className="hover:underline cursor-pointer font-medium"
        >
          {isLoadingComments ? 'Loading comments…' : commentCount > 0 ? `${commentCount} comments` : 'Comments'}
        </button>
      </div>

      {/* ── Reaction Buttons Bar (Like, Heart, Fire, Clap) ── */}
      <div className="px-3 py-1.5 flex items-center justify-between gap-1 text-xs font-semibold text-subText">
        {[
          { type: 'like' as const, label: 'Like', icon: ThumbsUp, activeColor: 'text-blue-400' },
          { type: 'heart' as const, label: 'Heart', icon: Heart, activeColor: 'text-red-400' },
          { type: 'fire' as const, label: 'Fire', icon: Flame, activeColor: 'text-amber-400' },
          { type: 'clap' as const, label: 'Clap', icon: Sparkles, activeColor: 'text-purple-400' },
        ].map(({ type, label, icon: Icon, activeColor }) => {
          const isActive = userReaction === type;
          const count = reactionCounts[type] || 0;
          return (
            <button
              key={type}
              onClick={() => handleReaction(type)}
              disabled={isReacting}
              className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded-md hover:bg-footer transition-all cursor-pointer ${
                isActive ? `${activeColor} font-bold bg-footer` : 'hover:text-mainText'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'fill-current' : ''}`} />
              <span>{label}</span>
              {count > 0 && <span className="text-[10px] opacity-80">({count})</span>}
            </button>
          );
        })}

        <button
          onClick={() => setIsCommentBoxOpen((o) => !o)}
          className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-md hover:bg-footer hover:text-mainText transition-colors cursor-pointer"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Comment</span>
        </button>
      </div>

      {/* ── Comments Section ── */}
      {isCommentBoxOpen && (
        <div className="p-4 bg-footer/35 space-y-3 border-t border-customBorder/60">
          {isLoadingComments ? (
            <div className="flex items-center justify-center py-4 text-xs text-subText gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-accent" />
              <span>Loading comments...</span>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {rootComments.length > 0 ? (
                rootComments.map((root) => {
                  const childReplies = getReplies(root.id);
                  return (
                    <div key={root.id} className="flex items-start gap-2.5">
                      <UserAvatar name={root.author_name || 'User'} src={root.author_pic} className="h-8 w-8 rounded-full border border-customBorder text-sm" textClassName="text-sm" />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="inline-block bg-card rounded-md border border-customBorder px-3 py-2 text-xs max-w-full">
                          <span className="font-bold text-mainText block">{root.author_name}</span>
                          <p className="text-mainText/90 leading-relaxed mt-0.5">{root.content}</p>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-subText pl-2">
                          <button
                            onClick={() => {
                              setActiveReplyId(activeReplyId === root.id ? null : root.id);
                              setReplyText('');
                            }}
                            className="font-bold hover:underline cursor-pointer"
                          >
                            Reply
                          </button>
                          <span className="text-[10px] text-subText/60">
                            {new Date(root.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Replies */}
                        {childReplies.length > 0 && (
                          <div className="pl-4 pt-1 space-y-2 border-l-2 border-customBorder/40 mt-1">
                            {childReplies.map((reply) => (
                              <div key={reply.id} className="flex items-start gap-2">
                                <UserAvatar name={reply.author_name || 'User'} src={reply.author_pic} className="h-7 w-7 rounded-full border border-customBorder text-xs" textClassName="text-xs" />
                                <div className="bg-card rounded-md border border-customBorder px-3 py-1.5 text-xs">
                                  <span className="font-bold text-mainText block">{reply.author_name}</span>
                                  <p className="text-subText">{reply.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reply Form */}
                        {activeReplyId === root.id && (
                          <form onSubmit={(e) => handleAddReply(e, root.id)} className="flex items-center gap-2 pt-1 pl-2">
                            <input
                              type="text"
                              placeholder={`Reply to ${root.author_name}...`}
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              className="flex-1 bg-primary border border-customBorder rounded-md px-3 py-1.5 text-xs text-mainText outline-none focus:border-accent"
                            />
                            <button type="submit" className="p-1.5 bg-accent text-[#101614] rounded-md cursor-pointer">
                              <Send className="w-3 h-3" />
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-subText/60 text-center py-2 italic font-mono">
                  No comments yet. Write a comment below.
                </p>
              )}
            </div>
          )}

          {/* Root Comment Form */}
          <form onSubmit={handleAddRootComment} className="flex items-center gap-2 pt-2 border-t border-customBorder/40">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-customBorder flex items-center justify-center text-sm shrink-0">
              👨‍💻
            </div>
            <input
              type="text"
              placeholder="Write a comment..."
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              className="flex-1 bg-primary border border-customBorder rounded-md px-3 py-2 text-xs text-mainText outline-none focus:border-accent placeholder:text-subText/60"
            />
            <button type="submit" className="p-2 bg-accent text-[#101614] rounded-md cursor-pointer hover:brightness-110">
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </article>
  );
};
