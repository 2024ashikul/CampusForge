import React, { useState } from 'react';
import { PostForm } from './PostForm';
import { PostCard } from './PostCard';
import type { PostData, PostAttachment } from './PostInterfaces';

export const PostFeedShowcase: React.FC = () => {
  const [posts, setPosts] = useState<PostData[]>([]);

  const handlePublish = (
    title: string, 
    markdown: string, 
    association: 'STUDENT' | 'CLUB', 
    attachments: Omit<PostAttachment, 'id' | 'postId'>[],
    tags: string[]
  ) => {
    const newId = `post-${Date.now()}`;
    const newPost: PostData = {
      id: newId,
      title,
      markdownContent: markdown,
      createdAt: 'Just now',
      author: {
        id: 'u-1',
        name: association === 'CLUB' ? 'AI Development Guild' : 'Alex Rivera',
        avatar: association === 'CLUB' ? '🏰' : '👨‍💻',
        association,
        roleTitle: association === 'CLUB' ? 'Lead Chapter' : 'Student Contributor'
      },
      attachments: attachments.map((a, i) => ({ ...a, id: `a-${newId}-${i}`, postId: newId })),
      comments: [],
      tags: tags,
      reactions: {} // Added clean reactions map allocation object to prevent runtime layout errors
    };
    setPosts([newPost, ...posts]);
  };

  return (
    // REFACTORED: bg-primary replaces dark hex background codes automatically
    <div className="min-h-screen bg-primary p-4 md:p-8 flex flex-col lg:flex-row gap-8 items-start transition-colors duration-200">
      
      {/* Interactive Form Panel Widget */}
      <div className="w-full lg:w-5/12">
        <PostForm onPublish={handlePublish} />
      </div>
      
      {/* Activity Stream Container */}
      <div className="w-full lg:w-7/12 space-y-4">
        {/* REFACTORED: text-subText handles label rendering gracefully across modes */}
        <h2 className="text-xs font-bold text-subText uppercase tracking-[0.2em] px-2 mb-4">
          Activity Stream Feed
        </h2>
        
        {posts.length === 0 ? (
          // REFACTORED: Dynamic boundary borders and responsive fallback text colors
          <div className="p-8 border border-dashed border-customBorder rounded-xl text-center text-xs text-subText font-mono bg-card/20 transition-all">
            No active stream updates found. Type details and configure payloads inside the form workbench to generate content feeds.
          </div>
        ) : (
          posts.map(p => <PostCard key={p.id} postData={p} />)
        )}
      </div>

    </div>
  );
};

export default PostFeedShowcase;