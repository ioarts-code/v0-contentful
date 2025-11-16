import Link from "next/link";
import { draftMode } from "next/headers";

import MoreStories from "../../more-stories";
import Avatar from "../../avatar";
import Date from "../../date";
import CoverImage from "../../cover-image";

import { Markdown } from "@/lib/markdown";
import { getAllPosts, getPostAndMorePosts } from "@/lib/api";

export async function generateStaticParams() {
  const allPosts = await getAllPosts(false);

  return allPosts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function PostPage({ params }: any) {
  const { isEnabled } = await draftMode();
  const { post, morePosts } = await getPostAndMorePosts(params.slug, isEnabled);

  if (!post) {
    return (
      <div className="container mx-auto px-5">
        <h1 className="text-3xl font-bold mt-12">Post not found</h1>
        <p className="mt-4">The post you are looking for does not exist.</p>
      </div>
    );
  }

  const mappedMorePosts = morePosts.map((post: any) => ({
    ...post,
    coverImage: post.image,
  }));

  return (
    <div className="container mx-auto px-5">
      <h2 className="mb-20 mt-8 text-2xl font-bold leading-tight tracking-tight md:text-4xl md:tracking-tighter">
        <Link href="/" className="hover:underline">
          Blog
        </Link>
        .
      </h2>
      <article>
        <h1 className="mb-12 text-center text-6xl font-bold leading-tight tracking-tighter md:text-left md:text-7xl md:leading-none lg:text-8xl">
          {post.title}
        </h1>
        
        {post.image?.url && (
          <div className="mb-8 sm:mx-0 md:mb-16">
            <CoverImage title={post.title} url={post.image.url} />
          </div>
        )}
        
        <div className="mx-auto max-w-2xl">
          {post.author && (
            <div className="mb-6 text-lg font-semibold">
              By {post.author}
            </div>
          )}
          
          {post.sys?.publishedAt && (
            <div className="mb-6 text-lg text-gray-600">
              <Date dateString={post.sys.publishedAt} />
            </div>
          )}
          
          {post.price !== undefined && post.price !== null && (
            <div className="mb-6 text-2xl font-bold text-blue-600">
              ${post.price}
            </div>
          )}
          
          <div className="mb-6 text-sm text-gray-500">
            Slug: {post.slug}
          </div>
        </div>

        {post.content && (
          <div className="mx-auto max-w-2xl">
            <div className="prose">
              <Markdown content={post.content} />
            </div>
          </div>
        )}
      </article>
      <hr className="border-accent-2 mt-28 mb-24" />
      <MoreStories morePosts={mappedMorePosts} />
    </div>
  );
}
