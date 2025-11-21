import { draftMode } from "next/headers"
import MoreStories from "./more-stories"
import { CsvButtons } from "./csv-buttons"

import { getAllPosts } from "@/lib/api"
import { CMS_NAME, CMS_URL } from "@/lib/constants"

function Intro() {
  return (
    <section className="flex-col md:flex-row flex items-center md:justify-between mt-16 mb-16 md:mb-12">
      <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-tight md:pr-8">Blog.</h1>
      <h2 className="text-center md:text-left text-lg mt-5 md:pl-8">
        A statically generated blog example using{" "}
        <a href="https://nextjs.org/" className="underline hover:text-success duration-200 transition-colors">
          Next.js
        </a>{" "}
        and{" "}
        <a href={CMS_URL} className="underline hover:text-success duration-200 transition-colors">
          {CMS_NAME}
        </a>
        .
      </h2>
    </section>
  )
}

function SetupInstructions() {
  return (
    <div className="border-2 border-warning rounded-lg p-8 my-8 bg-warning/10">
      <h2 className="text-2xl font-bold mb-4 text-warning-foreground">⚠️ No Blog Entries Found</h2>
      <p className="mb-4">
        Your Contentful space is connected, but there are no entries in the <strong>"Title"</strong> content type yet.
      </p>
      <div className="bg-background p-4 rounded border border-border mb-4">
        <h3 className="font-semibold mb-2">Quick Setup Steps:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>
            Go to{" "}
            <a
              href="https://app.contentful.com"
              className="underline text-primary hover:opacity-80"
              target="_blank"
              rel="noopener noreferrer"
            >
              app.contentful.com
            </a>
          </li>
          <li>Navigate to your space and click "Content"</li>
          <li>Click "Add entry" and select the "Title" content type</li>
          <li>Fill in the required fields: title, slug, author, and optionally image and price</li>
          <li>Click "Publish" to make the entry visible</li>
        </ol>
      </div>
      <p className="text-sm text-muted-foreground">
        Your Contentful space has a "Title" content type with fields: title, slug, image, author, and price.
      </p>
    </div>
  )
}

export default async function Page() {
  const { isEnabled } = await draftMode()
  const allPosts = await getAllPosts(isEnabled)

  return (
    <div className="container mx-auto px-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Intro />
        </div>
        <div className="flex-shrink-0 mt-16">
          <CsvButtons posts={allPosts} />
        </div>
      </div>
      {allPosts.length === 0 ? (
        <SetupInstructions />
      ) : (
        <MoreStories
          morePosts={allPosts.map((post) => ({
            ...post,
            coverImage: post.image,
            date: post.date || post.sys?.publishedAt,
            excerpt: post.excerpt || "",
          }))}
        />
      )}
    </div>
  )
}
