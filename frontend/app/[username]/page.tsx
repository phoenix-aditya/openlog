import { notFound } from "next/navigation";
import BlogCard from "@/components/BlogCard";
import ProfileDrafts from "@/components/ProfileDrafts";

const API_URL = (process.env.INTERNAL_API_URL ?? "http://localhost:8000") + "/api";

interface Blog {
  id: string; title: string; slug: string;
  created_at: string; tags: Array<{ name: string }>;
}

export default async function UserProfilePage({ params }: { params: { username: string } }) {
  const { username } = params;
  const res = await fetch(`${API_URL}/users/${username}/blogs`, { cache: "no-store" });
  if (res.status === 404) notFound();
  const blogs: Blog[] = await res.json();

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{username}</h1>
        <p className="text-gray-400 text-sm mt-1">
          {blogs.length} published post{blogs.length !== 1 ? "s" : ""}
        </p>
      </div>

      {blogs.length === 0 ? (
        <p className="text-gray-400">No published posts yet.</p>
      ) : (
        <div>
          {blogs.map((blog) => (
            <BlogCard
              key={blog.id}
              title={blog.title}
              slug={blog.slug}
              username={username}
              createdAt={blog.created_at}
              tags={blog.tags}
            />
          ))}
        </div>
      )}

      {/* Drafts section — only visible to the profile owner (client-side check) */}
      <ProfileDrafts username={username} />
    </main>
  );
}
