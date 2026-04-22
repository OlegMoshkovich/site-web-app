"use client";

import Link from "next/link";
import { Footer } from "@/components/footer";
import { useLanguage } from "@/lib/translations";

interface Post {
  slugAsParams: string;
  slug: string;
  title: string;
  description: string;
  published: string;
  category?: string;
  author?: string;
  coverImage?: string | null;
}

const ui = {
  en: {
    software: "Our Software",
    services: "Services",
    noPosts: "No posts yet.",
    allPosts: "All posts →",
    dateLocale: "en-US" as const,
  },
  de: {
    software: "Unsere Software",
    services: "Services",
    noPosts: "Noch keine Beiträge.",
    allPosts: "All posts →",
    dateLocale: "de-AT" as const,
  },
};

function LangSwitcher({ language, setLanguage }: { language: "de" | "en"; setLanguage: (l: "de" | "en") => void }) {
  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        onClick={() => setLanguage("de")}
        className={`${language === "de" ? "text-white" : "text-gray-600 hover:text-gray-400"} transition-colors`}
      >
        DE
      </button>
      <span className="text-gray-800">|</span>
      <button
        onClick={() => setLanguage("en")}
        className={`${language === "en" ? "text-white" : "text-gray-600 hover:text-gray-400"} transition-colors`}
      >
        EN
      </button>
    </div>
  );
}

export function BlogContent({ posts }: { posts: Post[] }) {
  const { language, setLanguage } = useLanguage();
  const c = ui[language];

  return (
    <main className="bg-black min-h-screen">
      {/* Sticky navbar */}
      <nav className="fixed top-0 z-50 w-full flex justify-center h-16 bg-black">
        <div className="w-full max-w-6xl flex justify-between items-center px-3 sm:px-8 text-md">
          <Link href="/services" className="font-bold text-white text-base bg-black px-3 py-1 border border-gray-800">
            clone:it
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/software" className="text-sm text-gray-400 hover:text-white transition-colors">
              {c.software}
            </Link>
            <Link href="/services" className="text-sm text-gray-400 hover:text-white transition-colors">
              {c.services}
            </Link>
            <LangSwitcher language={language} setLanguage={setLanguage} />
          </div>
        </div>
      </nav>

      {/* Posts grid */}
      <section className="w-full pt-28 pb-16">
        <div className="w-full max-w-6xl mx-auto px-3 sm:px-8">
          {posts.length === 0 ? (
            <p className="text-gray-600 text-sm">{c.noPosts}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <Link
                  key={post.slugAsParams}
                  href={post.slug}
                  className="group flex flex-col border border-gray-800 hover:border-gray-600 transition-colors overflow-hidden h-full"
                >
                  {post.coverImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    {post.category && (
                      <p className="text-xs text-gray-600 uppercase tracking-widest mb-3">
                        {post.category}
                      </p>
                    )}
                    <h2 className="text-base font-semibold text-white leading-snug mb-3 group-hover:text-gray-200 transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-sm text-gray-500 leading-relaxed mb-6 line-clamp-3 flex-1">
                      {post.description}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-800">
                      <time className="text-xs text-gray-700">
                        {new Date(post.published).toLocaleDateString(c.dateLocale, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </time>
                      {post.author && (
                        <span className="text-xs text-gray-700">{post.author}</span>
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
