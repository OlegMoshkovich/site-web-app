import { defineCollection, defineConfig } from "@content-collections/core";
import { compileMDX } from "@content-collections/mdx";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import { z } from "zod";

const posts = defineCollection({
  name: "posts",
  directory: "content/blog",
  include: "*.mdx",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    published: z.string(),
    category: z.string().optional(),
    author: z.string().optional(),
    /** Optional hero / card image; overrides first <img> in body when set */
    coverImage: z.string().optional(),
    content: z.string(),
    tags: z.array(z.string()).optional(),
  }),
  transform: async (document, context) => {
    const body = await compileMDX(context, document, {
      remarkPlugins: [remarkGfm],
      rehypePlugins: [
        rehypeSlug,
        [rehypeAutolinkHeadings, { behavior: "wrap" }],
        [
          rehypePrettyCode,
          {
            theme: "one-dark-pro",
            keepBackground: true,
          },
        ],
      ],
    });

    const slug = `/blog/${document._meta.path}`;
    const slugAsParams = document._meta.path;

    const coverMatch = document.content.match(/src=["']([^"']+)["']/);
    const coverImage =
      document.coverImage ?? (coverMatch ? coverMatch[1] : null);

    return {
      ...document,
      body,
      slug,
      slugAsParams,
      coverImage,
    };
  },
});

export default defineConfig({
  content: [posts],
});
