import { allPosts } from "content-collections";
import Link from "next/link";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Blog — clone:it",
  description: "Insights on construction management and digital tools.",
};

export default function BlogPage() {
  const posts = allPosts
    .slice()
    .sort(
      (a, b) =>
        new Date(b.published).getTime() - new Date(a.published).getTime(),
    );

  return (
    <main className="bg-black min-h-screen">
      {/* Sticky navbar */}
      <nav className="fixed top-0 z-50 w-full flex justify-center h-16 bg-black">
        <div className="w-full max-w-6xl flex justify-between items-center px-3 sm:px-8 text-md">
          <Link href="/" className="text-md font-semibold text-white">
            clone:it
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Simple Site
            </Link>
            <Link
              href="/blog"
              className="text-sm text-white transition-colors"
            >
              Blog
            </Link>
            <Link
              href="/auth/login"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      {/* Posts grid */}
      <section className="w-full pt-28 pb-16">
        <div className="w-full max-w-6xl mx-auto px-3 sm:px-8">
          {posts.length === 0 ? (
            <p className="text-gray-600 text-sm">No posts yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Link
                  key={post.slugAsParams}
                  href={post.slug}
                  className="group block border border-gray-800 hover:border-gray-600 transition-colors overflow-hidden"
                >
                  {post.coverImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6">
                  {post.category && (
                    <p className="text-xs text-gray-600 uppercase tracking-widest mb-3">
                      {post.category}
                    </p>
                  )}
                  <h2 className="text-base font-semibold text-white leading-snug mb-3 group-hover:text-gray-200 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-sm text-gray-500 leading-relaxed mb-6 line-clamp-3">
                    {post.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <time className="text-xs text-gray-700">
                      {new Date(post.published).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                    {post.author && (
                      <span className="text-xs text-gray-700">
                        {post.author}
                      </span>
                    )}
                  </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="w-full max-w-6xl mx-auto px-3 sm:px-8 border-t border-gray-800 [&>footer]:mt-0 [&>footer]:mb-0 [&>footer]:pt-6 [&>footer]:pb-6">
        <Footer textColor="text-gray-300" />
      </div>
    </main>
  );
}
