import React, { useState, useEffect } from 'react';
import { PostForm } from './PostForm';
import { PostCard } from './PostCard';
import type { PostData } from '../../interfaces/post.type';
import { getPostsApi, mapBackendPostToPostData, type BackendPost } from '../../services/api';

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



const handleSaved = (savedPost: BackendPost) => {
  setPosts((prevPosts) => [mapBackendPostToPostData(savedPost), ...prevPosts]);
};

  return (
    <div className="min-h-screen bg-primary p-4 md:p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {}
      <div className="lg:col-span-5 bg-card border border-customBorder rounded-lg p-4">
        <PostForm onSaved={handleSaved} />
      </div>
      
      {}
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
