import { notFound } from "next/navigation";
import Link from "next/link";
import TagBreadcrumb from "@/components/TagBreadcrumb";
import MarkdownRenderer from "@/components/MarkdownRenderer";

const API_URL = (process.env.INTERNAL_API_URL ?? "http://localhost:8000") + "/api";

interface Blog {
  id: string; title: string; slug: string; author_username: string;
  content: string; tags: Array<{ name: string }>; created_at: string;
}

export default async function BlogPostPage({
  params,
}: { params: Promise<{ username: string; slug: string }> }) {
  const { username, slug } = await params;
  const res = await fetch(`${API_URL}/blogs/${slug}?username=${username}`, { cache: "no-store" });
  if (res.status === 404) notFound();
  const blog: Blog = await res.json();

  const date = new Date(blog.created_at).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      {/* Back link */}
      <Link href={`/${username}`} className="text-sm text-gray-400 hover:text-gray-600 mb-8 inline-block">
        ← {username}
      </Link>

      <h1 className="text-4xl font-bold leading-tight mb-4 text-gray-900 dark:text-white">{blog.title}</h1>

      <div className="flex items-center gap-3 text-sm text-gray-400 dark:text-gray-500 mb-4">
        <span>{date}</span>
        {blog.tags.length > 0 && (
          <>
            <span>·</span>
            <TagBreadcrumb tags={blog.tags} />
          </>
        )}
      </div>

      <hr className="border-gray-100 mb-8" />

      <MarkdownRenderer content={blog.content} />
    </main>
  );
}
