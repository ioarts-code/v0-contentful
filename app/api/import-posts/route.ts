import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { posts } = await request.json()

    if (!posts || !Array.isArray(posts)) {
      return NextResponse.json({ error: "Invalid posts data" }, { status: 400 })
    }

    const spaceId = process.env.CONTENTFUL_SPACE_ID
    const accessToken = process.env.CONTENTFUL_MANAGEMENT_TOKEN

    if (!spaceId || !accessToken) {
      return NextResponse.json(
        {
          error: "⚠️ Missing Contentful Management Token",
          instructions: [
            "The CONTENTFUL_MANAGEMENT_TOKEN environment variable is not configured.",
            "",
            "To fix this:",
            "1. Go to app.contentful.com and sign in",
            "2. Click your profile icon (top right) > Settings > CMA tokens",
            "3. Click 'Create personal access token'",
            "4. Give it a name (e.g., 'v0 Import') and click 'Generate'",
            "5. Copy the token (it won't be shown again!)",
            "6. In v0, click the sidebar > Vars tab",
            "7. Add/Update: CONTENTFUL_MANAGEMENT_TOKEN = [paste your token]",
            "",
            "Note: Make sure to use a Personal Access Token, NOT a Content Delivery API key.",
          ],
        },
        { status: 500 },
      )
    }

    console.log("[v0] Testing Contentful Management API access...")

    const testResponse = await fetch(`https://api.contentful.com/spaces/${spaceId}/environments/master`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!testResponse.ok) {
      const errorData = await testResponse.json()
      console.error("[v0] Token validation failed:", errorData)

      return NextResponse.json(
        {
          error: "❌ Invalid or Insufficient Permissions",
          details: errorData.message || "The token cannot access this Contentful space",
          instructions: [
            "Your CONTENTFUL_MANAGEMENT_TOKEN has insufficient permissions.",
            "",
            "Common causes:",
            "• You're using a Content Delivery API token (read-only) instead of a Management token",
            "• Your Personal Access Token doesn't have access to this specific space",
            "• The token has been revoked or expired",
            "",
            "To fix this:",
            "1. Go to app.contentful.com and sign in",
            "2. Click your profile icon > Settings > CMA tokens",
            "3. Create a NEW Personal Access Token:",
            "   - Click 'Create personal access token'",
            "   - Give it a name (e.g., 'v0 CSV Import')",
            "   - Click 'Generate'",
            "4. Copy the new token immediately (you can't see it again!)",
            "5. In v0:",
            "   - Open the sidebar",
            "   - Go to the 'Vars' tab",
            "   - Find CONTENTFUL_MANAGEMENT_TOKEN",
            "   - Replace it with your new token",
            "   - Save",
            "",
            `Space ID: ${spaceId}`,
            `Error: ${errorData.sys?.id || "Unknown"}`,
          ],
        },
        { status: 401 },
      )
    }

    console.log("[v0] Token validated successfully, importing posts...")

    const results = []
    const errors = []

    const existingEntriesResponse = await fetch(
      `https://api.contentful.com/spaces/${spaceId}/environments/master/entries?content_type=title&limit=1000`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )

    const existingEntries = existingEntriesResponse.ok ? (await existingEntriesResponse.json()).items : []
    const existingTitles = new Set(existingEntries.map((entry: any) => entry.fields?.title?.["en-US"]))

    console.log(`[v0] Found ${existingTitles.size} existing entries`)

    for (const post of posts) {
      try {
        if (existingTitles.has(post.title)) {
          console.log(`[v0] Skipping duplicate title: ${post.title}`)
          results.push({ title: post.title, status: "skipped (already exists)" })
          continue
        }

        // First, upload the image if there's an imageUrl
        let imageAssetId = null
        if (post.imageUrl) {
          try {
            const assetResponse = await fetch(
              `https://api.contentful.com/spaces/${spaceId}/environments/master/assets`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/vnd.contentful.management.v1+json",
                  Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                  fields: {
                    title: {
                      "en-US": post.title || "Untitled",
                    },
                    file: {
                      "en-US": {
                        contentType: "image/png",
                        fileName: `${post.slug || "image"}.png`,
                        upload: post.imageUrl,
                      },
                    },
                  },
                }),
              },
            )

            if (assetResponse.ok) {
              const asset = await assetResponse.json()
              imageAssetId = asset.sys.id

              await new Promise((resolve) => setTimeout(resolve, 500))

              // Process the asset
              const processResponse = await fetch(
                `https://api.contentful.com/spaces/${spaceId}/environments/master/assets/${imageAssetId}/files/en-US/process`,
                {
                  method: "PUT",
                  headers: {
                    "X-Contentful-Version": "1",
                    Authorization: `Bearer ${accessToken}`,
                  },
                },
              )

              if (processResponse.ok) {
                await new Promise((resolve) => setTimeout(resolve, 1000))

                // Publish the asset
                await fetch(
                  `https://api.contentful.com/spaces/${spaceId}/environments/master/assets/${imageAssetId}/published`,
                  {
                    method: "PUT",
                    headers: {
                      "X-Contentful-Version": "2",
                      Authorization: `Bearer ${accessToken}`,
                    },
                  },
                )
              }
            }
          } catch (imageError) {
            console.error(`[v0] Error uploading image for ${post.title}:`, imageError)
          }
        }

        // Create the entry
        const entryResponse = await fetch(`https://api.contentful.com/spaces/${spaceId}/environments/master/entries`, {
          method: "POST",
          headers: {
            "Content-Type": "application/vnd.contentful.management.v1+json",
            "X-Contentful-Content-Type": "title",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            fields: {
              title: {
                "en-US": post.title || "Untitled",
              },
              slug: {
                "en-US": post.slug || "",
              },
              author: {
                "en-US": post.author || "",
              },
              price: {
                "en-US": Number.parseFloat(post.price) || 0,
              },
              ...(post.content && {
                description: {
                  "en-US": post.content,
                },
              }),
              ...(post.categories && {
                categories: {
                  "en-US": post.categories,
                },
              }),
              ...(imageAssetId && {
                image: {
                  "en-US": {
                    sys: {
                      type: "Link",
                      linkType: "Asset",
                      id: imageAssetId,
                    },
                  },
                },
              }),
            },
          }),
        })

        if (entryResponse.ok) {
          const entry = await entryResponse.json()

          // Publish the entry
          const publishResponse = await fetch(
            `https://api.contentful.com/spaces/${spaceId}/environments/master/entries/${entry.sys.id}/published`,
            {
              method: "PUT",
              headers: {
                "X-Contentful-Version": "1",
                Authorization: `Bearer ${accessToken}`,
              },
            },
          )

          if (publishResponse.ok) {
            results.push({ title: post.title, status: "created" })
          } else {
            const publishError = await publishResponse.json()
            console.error(`[v0] Publish failed for ${post.title}:`, publishError)
            results.push({ title: post.title, status: "created (draft only)" })
          }
        } else {
          const errorData = await entryResponse.json()
          console.error(`[v0] Entry creation failed for ${post.title}:`, errorData)
          errors.push({ title: post.title, error: errorData.message || "Failed to create entry" })
        }
      } catch (error) {
        console.error(`[v0] Error importing ${post.title}:`, error)
        errors.push({ title: post.title, error: error instanceof Error ? error.message : "Unknown error" })
      }
    }

    return NextResponse.json({
      success: true,
      created: results.length,
      errors: errors.length,
      results,
      errors,
    })
  } catch (error) {
    console.error("[v0] Import error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to import posts" },
      { status: 500 },
    )
  }
}
