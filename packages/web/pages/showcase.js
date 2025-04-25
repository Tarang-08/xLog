import Head from "next/head"
import PropTypes from "prop-types"

export default function Showcase({ posts }) {
  return (
    <>
      <Head>
        <title>Blog Showcase</title>
      </Head>
      <div className="max-w-4xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6 text-center">Blog Showcase</h1>
        <p className="text-gray-600 text-center mb-10">
          A curated list of recent blog posts powered by xLog and Crossbell.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {posts.map((post, idx) => (
            <div
              key={idx}
              className="p-6 border rounded-xl shadow hover:shadow-lg transition"
            >
              <h2 className="text-xl font-semibold mb-2">
                {post.title || "Untitled Post"}
              </h2>
              <p className="text-gray-700 text-sm">
                {post.content?.slice(0, 100)}...
              </p>
              <span className="text-sm text-blue-500 mt-2 inline-block">
                #{post.tags?.[0] || "untagged"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// ✅ Fix ESLint: define prop types
Showcase.propTypes = {
  posts: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string,
      content: PropTypes.string,
      tags: PropTypes.arrayOf(PropTypes.string),
    }),
  ).isRequired,
}

// ✅ Server-side props fetch
export async function getServerSideProps() {
  try {
    const res = await fetch("http://localhost:3000/api/post")
    const data = await res.json()

    return {
      props: {
        posts: data?.data || [],
      },
    }
  } catch (error) {
    console.error("Error fetching posts:", error)
    return {
      props: {
        posts: [],
      },
    }
  }
}
