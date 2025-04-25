"use client"

import { useLocale, useTranslations } from "next-intl"
import { useParams, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

import { useAccountState, useConnectModal } from "@crossbell/connect-kit"
import { Switch } from "@headlessui/react"

import { useIsMobileLayout } from "~/hooks/useMobileLayout"
import { getPosts } from "~/lib/firestoreService" // Firestore fetcher
import { getStorage, setStorage } from "~/lib/storage"
import { ExpandedNote, Language } from "~/lib/types"
import { useGetFeed } from "~/queries/home"

export const HomeFeed = ({ type }: { type?: FeedType }) => {
  const t = useTranslations()
  const searchParams = useSearchParams()
  const locale = useLocale() as Language
  const isMobileLayout = useIsMobileLayout()

  const currentCharacterId = useAccountState(
    (s) => s.computed.account?.characterId,
  )
  const connectModal = useConnectModal()

  const [hotInterval, setHotInterval] = useState(7)
  const [searchType, setSearchType] = useState("latest")
  const [aiFiltering, setAiFiltering] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [likes, setLikes] = useState<{ [key: string]: number }>({})
  const [bookmarks, setBookmarks] = useState<{ [key: string]: boolean }>({})
  const [comments, setComments] = useState<{ [key: string]: string[] }>({})
  const [commentInput, setCommentInput] = useState<{ [key: string]: string }>(
    {},
  )
  const [toast, setToast] = useState<string | null>(null)
  const [firebasePosts, setFirebasePosts] = useState<any[]>([])

  const handleLike = (noteId: string, title: string) => {
    const updatedLikes = {
      ...likes,
      [noteId]: (likes[noteId] || 0) + 1,
    }
    setLikes(updatedLikes)
    localStorage.setItem("postLikes", JSON.stringify(updatedLikes))
    setToast(`✅ You liked "${title}"`)
    setTimeout(() => setToast(null), 3000)
  }

  const handleShare = (noteId: string) => {
    const url = `${window.location.origin}/post/${noteId}`
    navigator.clipboard.writeText(url)
    setToast("🔗 Link copied to clipboard!")
    setTimeout(() => setToast(null), 3000)
  }

  const handleBookmark = (noteId: string) => {
    const updated = {
      ...bookmarks,
      [noteId]: !bookmarks[noteId],
    }
    setBookmarks(updated)
    setToast(updated[noteId] ? "⭐ Saved!" : "🗑️ Unsaved")
    setTimeout(() => setToast(null), 3000)
  }

  const handleCommentSubmit = (noteId: string) => {
    const newComment = commentInput[noteId]?.trim()
    if (!newComment) return
    setComments((prev) => ({
      ...prev,
      [noteId]: [...(prev[noteId] || []), newComment],
    }))
    setCommentInput((prev) => ({
      ...prev,
      [noteId]: "",
    }))
    setToast("💬 Comment added!")
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    const storedLikes = localStorage.getItem("postLikes")
    if (storedLikes) setLikes(JSON.parse(storedLikes))
    setAiFiltering(getStorage("ai_filtering")?.enabled ?? true)
    setIsMounted(true)

    const fetchFirebasePosts = async () => {
      const posts = await getPosts()
      setFirebasePosts(posts)
    }
    fetchFirebasePosts()
  }, [])

  const params = useParams()
  if (params.topic) {
    params.topic = decodeURIComponent(params.topic as string)
  }

  let feedConfig: Parameters<typeof useGetFeed>[0] = { type }
  switch (type) {
    case "following":
      feedConfig = { type, characterId: currentCharacterId }
      break
    case "topic":
      feedConfig = { type, topic: params.topic }
      break
    case "hottest":
      feedConfig = { type, daysInterval: hotInterval }
      break
    case "search":
      feedConfig = {
        type,
        searchKeyword: searchParams?.get("q") || undefined,
        searchType,
      }
      break
    case "tag":
      feedConfig = { type, tag: decodeURIComponent(params?.tag as string) }
      break
  }

  const feed = useGetFeed({ ...feedConfig, translateTo: locale })
  const hasFiltering = type === "latest"

  const [feedInOne, setFeedInOne] = useState<ExpandedNote[]>(
    feed.data?.pages?.[0]?.list || [],
  )
  useEffect(() => {
    if (feed.data?.pages?.length) {
      const flatPosts = feed.data.pages.flatMap((page) => page?.list || [])
      setFeedInOne(
        flatPosts.filter((post) => {
          const score = post.metadata?.content?.score?.number
          return !(
            aiFiltering &&
            hasFiltering &&
            typeof score === "number" &&
            score <= 60
          )
        }),
      )
    }
  }, [feed.data?.pages, aiFiltering, hasFiltering])

  return (
    <>
      {toast && (
        <div className="fixed bottom-4 right-4 bg-green-700 text-white px-4 py-2 rounded shadow-lg z-50">
          {toast}
        </div>
      )}

      <div className="bg-white border border-gray-300 p-6 rounded-lg my-6">
        <h2 className="text-2xl font-bold text-center mb-4">
          📰 Featured Posts
        </h2>
        {feedInOne.length === 0 ? (
          <p className="text-center text-gray-600">No posts available.</p>
        ) : (
          <ul className="space-y-2">
            {feedInOne.slice(0, 5).map((post) => (
              <li
                key={`${post.characterId}-${post.noteId}`}
                className="border rounded p-4 hover:shadow flex flex-col gap-2"
              >
                <div className="text-gray-400 text-xl">🖼️</div>
                <h3 className="font-semibold text-lg">
                  {post.metadata?.content?.title || "Untitled Post"}
                </h3>
                <p className="text-sm text-gray-600">
                  {post.metadata?.content?.content?.slice(0, 100) ||
                    "No content"}
                  ...
                </p>
                <div className="flex flex-wrap gap-4 text-sm mt-2">
                  <button
                    className="text-red-500 hover:underline"
                    onClick={() =>
                      handleLike(
                        post.noteId,
                        post.metadata?.content?.title || "Untitled Post",
                      )
                    }
                  >
                    ❤️ Like ({likes[post.noteId] || 0})
                  </button>
                  <button
                    className="text-indigo-600 hover:underline"
                    onClick={() => handleShare(post.noteId)}
                  >
                    🔗 Share
                  </button>
                  <button
                    className="text-yellow-600 hover:underline"
                    onClick={() => handleBookmark(post.noteId)}
                  >
                    {bookmarks[post.noteId] ? "✅ Saved" : "⭐ Save"}
                  </button>
                </div>
                <div className="mt-3">
                  <p className="text-sm font-semibold mb-1">
                    💬 Comments ({comments[post.noteId]?.length || 0})
                  </p>
                  <input
                    className="w-full border px-3 py-1 rounded text-sm mb-2"
                    placeholder="Add a comment..."
                    value={commentInput[post.noteId] || ""}
                    onChange={(e) =>
                      setCommentInput((prev) => ({
                        ...prev,
                        [post.noteId]: e.target.value,
                      }))
                    }
                  />
                  <button
                    onClick={() => handleCommentSubmit(post.noteId)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Submit
                  </button>
                  {comments[post.noteId]?.length > 0 && (
                    <ul className="mt-2 space-y-1 text-sm text-gray-700">
                      {comments[post.noteId].map((c, i) => (
                        <li key={i}>• {c}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* 🔥 Firebase Posts Section */}
        {firebasePosts.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-bold mb-2">🔥 Firebase Posts</h3>
            <ul className="space-y-2">
              {firebasePosts.map((post) => (
                <li key={post.id} className="border rounded p-4 bg-gray-50">
                  <h4 className="font-semibold text-lg">{post.title}</h4>
                  <p className="text-sm text-gray-700">{post.content}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {hasFiltering && (
        <div className="flex items-center text-zinc-500 mt-10">
          <i className="i-mingcute-sparkles-line mr-2 text-lg" />
          <span className="mr-1 cursor-default">
            {t("Enable AI Filtering")}
          </span>
          <Switch
            checked={aiFiltering}
            onChange={(value) => {
              setAiFiltering(value)
              setStorage("ai_filtering", { enabled: value })
            }}
            className={`${aiFiltering ? "bg-accent" : "bg-gray-200"} ml-5 relative inline-flex h-6 w-11 items-center rounded-full`}
          >
            <span className="sr-only">Enable AI Filtering</span>
            <span
              className={`${aiFiltering ? "translate-x-6" : "translate-x-1"} inline-block size-4 rounded-full bg-white transition`}
            />
          </Switch>
        </div>
      )}
    </>
  )
}
