import Link from "next/link";
import { draftMode } from "next/headers";

import Date from "./date";
import CoverImage from "./cover-image";
import Avatar from "./avatar";
import MoreStories from "./more-stories";

import { getAllPosts } from "@/lib/api";
import { CMS_NAME, CMS_URL } from "@/lib/constants";

function Intro() {
  return (
    <section className="flex-col md:flex-row flex items-center md:justify-between mt-16 mb-16 md:mb-12">
      <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-tight md:pr-8">
        Blog.
      </h1>
      <h2 className="text-center md:text-left text-lg mt-5 md:pl-8">
        A statically generated blog example using{" "}
        <a
          href="https://nextjs.org/"
          className="underline hover:text-success duration-200 transition-colors"
        >
          Next.js
        </a>{" "}
        and{" "}
        <a
          href={CMS_URL}
          className="underline hover:text-success duration-200 transition-colors"
        >
          {CMS_NAME}
        </a>
        .
      </h2>
    </section>
  );
}

function SetupInstructions() {
  return (
    <div className="border-2 border-yellow-500 rounded-lg p-8 my-8 bg-yellow-50">
      <h2 className="text-2xl font-bold mb-4 text-yellow-900">
        ⚠️ Contentful Setup Required
      </h2>
      <p className="mb-4 text-yellow-900">
        Your Contentful space needs a <strong>"Blog Post"</strong> content type configured before this blog can display posts.
      </p>
      <div className="bg-white p-4 rounded border border-yellow-300 mb-4">
        <h3 className="font-semibold mb-2 text-yellow-900">Quick Setup Steps:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-900">
          <li>Go to <a href="https://app.contentful.com" className="underline text-blue-600 hover:text-blue-800" target="_blank" rel="noopener noreferrer">app.contentful.com</a></li>
          <li>Navigate to your space and click "Content model"</li>
          <li>Create an "Author" content type with fields: name (text), picture (media)</li>
          <li>Create a "Blog Post" content type with fields: title, slug, date, excerpt, content (rich text), coverImage (media), author (reference)</li>
          <li>Add some sample blog post entries</li>
        </ol>
      </div>
      <p className="text-sm text-yellow-800">
        See <code className="bg-yellow-100 px-2 py-1 rounded">CONTENTFUL_SETUP.md</code> for detailed instructions.
      </p>
    </div>
  );
}

function HeroPost({
  title,
  coverImage,
  date,
  excerpt,
  author,
  slug,
}: {
  title: string;
  coverImage: any;
  date: string;
  excerpt: string;
  author: any;
  slug: string;
}) {
  return (
    <section>
      {coverImage?.url && (
        <div className="mb-8 md:mb-16">
          <CoverImage title={title} slug={slug} url={coverImage.url} />
        </div>
      )}
      <div className="md:grid md:grid-cols-2 md:gap-x-16 lg:gap-x-8 mb-20 md:mb-28">
        <div>
          <h3 className="mb-4 text-4xl lg:text-6xl leading-tight">
            <Link href={`/posts/${slug}`} className="hover:underline">
              {title}
            </Link>
          </h3>
          {date && (
            <div className="mb-4 md:mb-0 text-lg">
              <Date dateString={date} />
            </div>
          )}
        </div>
        <div>
          {excerpt && <p className="text-lg leading-relaxed mb-4">{excerpt}</p>}
          {author && <Avatar name={author.name} picture={author.picture} />}
        </div>
      </div>
    </section>
  );
}

export default async function Page() {
  const { isEnabled } = await draftMode();
  const allPosts = await getAllPosts(isEnabled);
  
  const heroPost = allPosts[0];
  const morePosts = allPosts.slice(1);

  return (
    <div className="container mx-auto px-5">
      <Intro />
      {!heroPost ? (
        <SetupInstructions />
      ) : (
        <>
          <HeroPost
            title={heroPost.title}
            coverImage={heroPost.image}
            date={heroPost.date || heroPost.sys?.publishedAt}
            author={heroPost.author}
            slug={heroPost.slug}
            excerpt={heroPost.excerpt || ""}
          />
          <MoreStories morePosts={morePosts} />
        </>
      )}
    </div>
  );
}
