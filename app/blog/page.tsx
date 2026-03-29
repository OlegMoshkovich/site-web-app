import { allPosts } from "content-collections";
import { BlogContent } from "./blog-content";

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

  return <BlogContent posts={posts} />;
}
