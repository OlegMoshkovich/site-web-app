import { allPosts } from "content-collections";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MdxComponent } from "@/components/mdx-component";
import { Footer } from "@/components/footer";
import "@/app/mdx.css";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return allPosts.map((post) => ({ slug: post.slugAsParams }));
}

export async function generateMetadata({ params }: PostPageProps) {
  const { slug } = await params;
  const post = allPosts.find((p) => p.slugAsParams === slug);
  if (!post) return {};
  return {
    title: `${post.title} — clone:it`,
    description: post.description,
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = allPosts.find((p) => p.slugAsParams === slug);

  if (!post) {
    notFound();
  }

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
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Blog
            </Link>
          </div>
        </div>
      </nav>

      {/* Post header */}
      <section className="pt-40 w-full">
        <div className="w-full max-w-3xl mx-auto px-3 sm:px-8 border-b border-gray-800 pb-12">
          <Link
            href="/blog"
            className="text-xs text-gray-600 uppercase tracking-widest hover:text-gray-400 transition-colors mb-8 inline-block"
          >
            ← Blog
          </Link>
          {post.category && (
            <p className="text-xs text-gray-600 uppercase tracking-widest mb-4">
              {post.category}
            </p>
          )}
          <h1 className="text-3xl sm:text-5xl font-semibold text-white leading-tight mb-6">
            {post.title}
          </h1>
          <p className="text-base text-gray-400 leading-relaxed mb-8">
            {post.description}
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <time>
              {new Date(post.published).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            {post.author && (
              <>
                <span>·</span>
                <span>{post.author}</span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Post content */}
      <section className="py-16 w-full">
        <div className="w-full max-w-3xl mx-auto px-3 sm:px-8">
          <MdxComponent code={post.body} />
        </div>
      </section>

      <div className="w-full max-w-6xl mx-auto px-3 sm:px-8 border-t border-gray-800 [&>footer]:mt-0 [&>footer]:mb-0 [&>footer]:pt-6 [&>footer]:pb-6">
        <Footer textColor="text-gray-300" />
      </div>
    </main>
  );
}
