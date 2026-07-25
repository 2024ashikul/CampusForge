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

// PostFeedShowcase.tsx

const handlePublish = async (
  title: string, 
  markdown: string, 
  association: 'STUDENT' | 'CLUB', 
  attachments: Omit<PostAttachment, 'id' | 'postId'>[],
  tags: string[]
) => {
  const postType = tags.includes('Project') 
    ? 'project' 
    : association === 'CLUB' 
      ? 'announcement' 
      : 'post';

  // Map attachments to match PostMediaSchema
  const formattedMedia = attachments.map((att, idx) => ({
    media_type: att.type.toLowerCase(), // 'photo' | 'video' | 'link'
    file_url: att.url,
    display_order: idx,
  }));

  try {
    // 1. Send single unified request to Backend API
    const backendResult = await createPostApi({
      title: title.trim(),
      description: markdown.trim(),
      post_type: postType,
      status: 'published',
      club_id: association === 'CLUB' ? 1 : null,
      tags: tags,
      media: formattedMedia,
    });

    // 2. Map response to UI PostData shape
    const newPost: PostData = mapBackendPostToPostData(backendResult);

    // 3. Prepend to state list
    setPosts((prevPosts) => [newPost, ...prevPosts]);
  } catch (err: any) {
    console.error('Failed to create post:', err.message);
    alert(`Post creation failed:\n${err.message}`);
  }
};

  return (
    <div className="min-h-screen bg-primary p-4 md:p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* Interactive Form Panel Widget */}
      <div className="lg:col-span-5 bg-card border border-customBorder rounded-lg p-4">
        <PostForm onPublish={handlePublish} />
      </div>
      
      {/* Activity Stream Container */}
      <div className="lg:col-span-7 space-y-4">
        <h2 className="text-xs font-bold text-subText uppercase tracking-[0.14em] mb-3">
          Recent activity
        </h2>
        
        {posts.length === 0 ? (
          <div className="p-8 border border-dashed border-customBorder rounded-lg text-center text-xs text-subText bg-card">
            No posts yet. Use the form to publish the first update.
          </div>
        ) : (
          posts.map(p => <PostCard key={p.id} postData={p} />)
        )}
      </div>

      </div>
    </div>
  );
};

export default PostFeedShowcase;
