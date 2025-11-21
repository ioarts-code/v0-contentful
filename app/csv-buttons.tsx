"use client"

import type React from "react"

import { Download, Upload, X } from "lucide-react"
import { useRef, useState } from "react"

interface Post {
  title: string
  slug: string
  author?: string
  price?: number
  description?: string
  categories?: string
  sys?: {
    publishedAt?: string
  }
  image?: {
    url?: string
  }
}

export function CsvButtons({ posts }: { posts: Post[] }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleExport = () => {
    const headers = ["Title", "Slug", "Author", "Price", "Content", "Categories", "Published Date", "Image URL"]
    const rows = posts.map((post) => [
      post.title || "",
      post.slug || "",
      post.author || "",
      post.price?.toString() || "",
      post.description || "",
      post.categories || "",
      post.sys?.publishedAt || "",
      post.image?.url || "",
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `blog-posts-${Date.now()}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split("\n").filter((line) => line.trim())

        if (lines.length < 2) {
          setErrorMessage("CSV file must contain at least a header row and one data row.")
          return
        }

        const headerLine = lines[0]
        const headers = headerLine.split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase())

        const titleIdx = headers.findIndex((h) => h.includes("title"))
        const slugIdx = headers.findIndex((h) => h.includes("slug"))
        const authorIdx = headers.findIndex((h) => h.includes("author"))
        const priceIdx = headers.findIndex((h) => h.includes("price"))
        const contentIdx = headers.findIndex((h) => h.includes("content") || h.includes("description"))
        const categoriesIdx = headers.findIndex((h) => h.includes("categories") || h.includes("category"))
        const dateIdx = headers.findIndex((h) => h.includes("date") || h.includes("published"))
        const imageIdx = headers.findIndex((h) => h.includes("image") || h.includes("url"))

        const importedPosts = lines.slice(1).map((line) => {
          const values =
            line
              .match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)
              ?.map((v) => v.trim().replace(/^"|"$/g, "").replace(/""/g, '"')) || []

          return {
            title: titleIdx >= 0 ? values[titleIdx] || "" : "",
            slug: slugIdx >= 0 ? values[slugIdx] || "" : "",
            author: authorIdx >= 0 ? values[authorIdx] || "" : "",
            price: priceIdx >= 0 && values[priceIdx] ? Number.parseFloat(values[priceIdx]) : 0,
            content: contentIdx >= 0 ? values[contentIdx] || "" : "",
            categories: categoriesIdx >= 0 ? values[categoriesIdx] || "" : "",
            publishedAt: dateIdx >= 0 ? values[dateIdx] || "" : "",
            imageUrl: imageIdx >= 0 ? values[imageIdx] || "" : "",
          }
        })

        setIsImporting(true)
        try {
          console.log("[v0] Calling import API...")
          const response = await fetch("/api/import-posts", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ posts: importedPosts }),
          })

          const result = await response.json()
          console.log("[v0] Import API response:", response.ok, result)

          if (response.ok) {
            alert(
              `Successfully imported ${result.created} posts to Contentful!\n\n${
                result.errors > 0 ? `${result.errors} posts failed to import.\n\n` : ""
              }Refresh the page to see the new posts.`,
            )

            window.location.reload()
          } else {
            let errorText = result.error || "Error importing posts"

            if (result.instructions && Array.isArray(result.instructions)) {
              errorText += "\n\n" + result.instructions.join("\n")
            }

            if (result.details) {
              errorText += `\n\n${result.details}`
            }

            console.log("[v0] Setting error message:", errorText)
            setErrorMessage(errorText)
          }
        } catch (error) {
          console.error("[v0] Error calling import API:", error)
          const errorText = "Error importing posts to Contentful. Please check the console for details."
          console.log("[v0] Setting error message:", errorText)
          setErrorMessage(errorText)
        } finally {
          setIsImporting(false)
        }

        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      } catch (error) {
        console.error("[v0] Error importing CSV:", error)
        const errorText = "Error parsing CSV file. Please check the format and try again."
        console.log("[v0] Setting error message:", errorText)
        setErrorMessage(errorText)
        setIsImporting(false)
      }
    }
    reader.readAsText(file)
  }

  console.log("[v0] errorMessage state:", errorMessage)

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          title="Export posts to CSV"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export CSV</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Import posts from CSV"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">{isImporting ? "Importing..." : "Import CSV"}</span>
        </button>

        <input ref={fileInputRef} type="file" accept=".csv" onChange={handleImport} className="hidden" />
      </div>

      {errorMessage && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-[9999]"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <div className="bg-background border-2 border-border rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex items-start justify-between p-6 border-b border-border bg-muted">
              <h2 className="text-lg font-semibold text-foreground">Import Error</h2>
              <button
                onClick={() => {
                  console.log("[v0] Closing error modal")
                  setErrorMessage(null)
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 bg-background">
              <pre className="whitespace-pre-wrap text-sm text-foreground font-mono bg-muted p-4 rounded-md border border-border">
                {errorMessage}
              </pre>
            </div>
            <div className="flex justify-end p-6 border-t border-border bg-muted">
              <button
                onClick={() => {
                  console.log("[v0] Closing error modal")
                  setErrorMessage(null)
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
