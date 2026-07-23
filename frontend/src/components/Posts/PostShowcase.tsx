import React, { useState, useEffect } from 'react';
import { PostForm } from './PostForm';
import { PostCard } from './PostCard';
import type { PostData, PostAttachment } from '../../interfaces/post.type';
import { getPostsApi, createPostApi, mapBackendPostToPostData } from '../../services/api';

export const PostFeedShowcase: React.FC = () => {
  const [posts, setPosts] = useState<PostData[]>([]);

  useEffect(() => {
    async function loadBackendPosts() {
      const data = await getPostsApi();
      if (data && data.length > 0) {
        setPosts(data.map(mapBackendPostToPostData));
      }
    }
    loadBackendPosts();
  }, []);

  const handlePublish = async (
    title: string, 
    markdown: string, 
    association: 'STUDENT' | 'CLUB', 
    attachments: Omit<PostAttachment, 'id' | 'postId'>[],
    tags: string[]
  ) => {
    const postType = tags.includes('Project') ? 'project' : association === 'CLUB' ? 'announcement' : 'general';
    
    // Call backend API
    const backendResult = await createPostApi({
      title,
      description: markdown,
      post_type: postType,
      user_id: association === 'STUDENT' ? 1 : undefined,
      club_id: association === 'CLUB' ? 1 : undefined
    });

    const newId = backendResult ? `post-${backendResult.id}` : `post-${Date.now()}`;
    const newPost: PostData = {
      id: newId,
      title,
      markdownContent: markdown,
      createdAt: 'Just now',
      postType: postType === 'project' ? 'PROJECT' : postType === 'announcement' ? 'ClubAnnouncement' : 'DISCUSSION',
      author: {
        id: association === 'CLUB' ? 'c-1' : 'u-1',
        name: association === 'CLUB' ? 'AI Development Guild' : 'Alex Rivera',
        avatar: association === 'CLUB' ? '🏰' : '👨‍💻',
        association,
        roleTitle: association === 'CLUB' ? 'Lead Chapter' : 'Student Contributor'
      },
      attachments: attachments.map((a, i) => ({ ...a, id: `a-${newId}-${i}`, postId: newId })),
      comments: [],
      tags: tags,
      reactions: {}
    };
    setPosts([newPost, ...posts]);
  };

  return (
    <div className="min-h-screen bg-primary p-4 md:p-8 flex flex-col lg:flex-row gap-8 items-start transition-colors duration-200">
      
      {/* Interactive Form Panel Widget */}
      <div className="w-full lg:w-5/12">
        <PostForm onPublish={handlePublish} />
      </div>
      
      {/* Activity Stream Container */}
      <div className="w-full lg:w-7/12 space-y-4">
        <h2 className="text-xs font-bold text-subText uppercase tracking-[0.2em] px-2 mb-4">
          Activity Stream Feed
        </h2>
        
        {posts.length === 0 ? (
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