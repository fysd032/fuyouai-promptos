"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Post = {
  title: string;
  href: string;
  summary: string;
  date: string;
  category: string;
};

function BlogCard({ post }: { post: Post }) {
  return (
    <Link
      href={post.href}
      target="_blank"
      className="group relative flex flex-col gap-4 p-6 rounded-2xl overflow-hidden cursor-pointer
        bg-white/[0.02] border border-white/5
        shadow-md
        hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50
        transition-all duration-300 ease-out"
    >
      {/* Top highlight — 顶部高光线 */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]
          bg-gradient-to-r from-blue-500 via-blue-400/60 to-transparent
          opacity-40 group-hover:opacity-100
          transition-opacity duration-300 ease-out"
      />

      {/* Glow halo behind the highlight */}
      <div
        className="absolute top-0 left-0 w-2/3 h-[10px]
          bg-gradient-to-r from-blue-500/25 to-transparent
          blur-md opacity-0 group-hover:opacity-100
          transition-opacity duration-300 ease-out"
      />

      {/* Meta row */}
      <div className="flex items-center justify-between">
        {post.category && (
          <span className="text-[10px] font-medium tracking-wider uppercase text-slate-500 bg-white/[0.05] px-2.5 py-1 rounded-full">
            {post.category}
          </span>
        )}
        {post.date && (
          <span className="text-[10px] text-slate-600">{post.date}</span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-slate-200 leading-snug
        group-hover:text-white transition-colors duration-200">
        {post.title}
      </h3>

      {/* Summary */}
      <p className="text-sm text-slate-500 leading-relaxed flex-1">
        {post.summary}
      </p>

      {/* Read link */}
      <div className="flex items-center gap-1 text-xs text-slate-600
        group-hover:text-blue-400 transition-colors duration-200 mt-auto">
        Read
        <ArrowRight
          size={12}
          className="group-hover:translate-x-0.5 transition-transform duration-200"
        />
      </div>
    </Link>
  );
}

export const BlogPreviewSection: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    fetch("/api/blog-posts")
      .then((r) => r.json())
      .then(setPosts)
      .catch(() => {});
  }, []);

  if (posts.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-6 py-24 relative z-10">
      <div className="flex items-end justify-between mb-12">
        <div>
          <p className="text-xs font-medium tracking-[0.25em] text-slate-500 uppercase mb-4">
            Insights
          </p>
          <h2 className="text-3xl lg:text-4xl font-semibold text-white tracking-tight">
            Learn how to do real work with AI
          </h2>
        </div>
        <Link
          href="https://blog.fuyouai.com"
          target="_blank"
          className="hidden md:flex items-center gap-1.5 text-sm text-slate-500 hover:text-white transition-colors"
        >
          All posts <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {posts.map((post) => (
          <BlogCard key={post.title} post={post} />
        ))}
      </div>
    </section>
  );
};
