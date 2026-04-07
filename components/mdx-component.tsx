import { useMDXComponent } from "@content-collections/mdx/react";
import Image from "next/image";
import React from "react";

function Callout({
  children,
  type = "default",
}: {
  children: React.ReactNode;
  type?: "default" | "warning" | "danger";
}) {
  const borderColor =
    type === "danger"
      ? "border-red-800"
      : type === "warning"
        ? "border-yellow-800"
        : "border-gray-700";

  return (
    <div className={`my-6 rounded border-l-4 ${borderColor} bg-gray-900 px-5 py-4`}>
      <div className="text-sm text-gray-300 [&>p]:m-0">{children}</div>
    </div>
  );
}

const components = {
  h1: ({ ...props }) => (
    <h1
      className="mt-10 mb-4 text-3xl font-semibold text-white leading-tight"
      {...props}
    />
  ),
  h2: ({ ...props }) => (
    <h2
      className="mt-10 mb-4 text-2xl font-semibold text-white leading-tight border-t border-gray-800 pt-8"
      {...props}
    />
  ),
  h3: ({ ...props }) => (
    <h3
      className="mt-8 mb-3 text-xl font-semibold text-white"
      {...props}
    />
  ),
  h4: ({ ...props }) => (
    <h4
      className="mt-6 mb-2 text-lg font-semibold text-white"
      {...props}
    />
  ),
  p: ({ ...props }) => (
    <p
      className="my-5 leading-7 text-gray-300"
      {...props}
    />
  ),
  a: ({ ...props }) => (
    <a
      className="text-white underline underline-offset-4 hover:text-gray-300 transition-colors"
      {...props}
    />
  ),
  ul: ({ ...props }) => (
    <ul
      className="my-5 ml-6 list-disc text-gray-300 space-y-2"
      {...props}
    />
  ),
  ol: ({ ...props }) => (
    <ol
      className="my-5 ml-6 list-decimal text-gray-300 space-y-2"
      {...props}
    />
  ),
  li: ({ ...props }) => (
    <li className="leading-7" {...props} />
  ),
  blockquote: ({ ...props }) => (
    <blockquote
      className="my-6 border-l-4 border-gray-700 pl-5 italic text-gray-400"
      {...props}
    />
  ),
  hr: ({ ...props }) => (
    <hr className="my-8 border-gray-800" {...props} />
  ),
  table: ({ ...props }) => (
    <div className="my-6 overflow-x-auto">
      <table
        className="w-full border-collapse text-sm text-gray-300"
        {...props}
      />
    </div>
  ),
  th: ({ ...props }) => (
    <th
      className="border border-gray-800 bg-gray-900 px-4 py-2 text-left font-semibold text-white"
      {...props}
    />
  ),
  td: ({ ...props }) => (
    <td className="border border-gray-800 px-4 py-2" {...props} />
  ),
  pre: ({ ...props }) => (
    <pre className="my-6" {...props} />
  ),
  code: ({ ...props }) => <code {...props} />,
  img: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt ?? ""}
      className="my-6 rounded max-w-full"
      {...props}
    />
  ),
  Image: ({
    src,
    alt,
    width,
    height,
    ...props
  }: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
  }) => (
    <Image
      src={src}
      alt={alt}
      width={width ?? 800}
      height={height ?? 450}
      className="my-6 rounded max-w-full"
      {...props}
    />
  ),
  Callout,
};

interface MdxComponentProps {
  code: string;
}

export function MdxComponent({ code }: MdxComponentProps) {
  const Component = useMDXComponent(code);
  return <Component components={components} />;
}
