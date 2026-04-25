import Link from "next/link";
import TagBreadcrumb from "./TagBreadcrumb";

interface BlogCardProps {
  title: string;
  slug: string;
  username: string;
  createdAt: string;
  tags: Array<{ name: string }>;
}

export default function BlogCard({ title, slug, username, createdAt, tags }: BlogCardProps) {
  const date = new Date(createdAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <article className="group py-6 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <Link href={`/${username}/${slug}`} className="block">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors mb-2">
          {title}
        </h2>
      </Link>
      <div className="flex items-center gap-3 text-sm text-gray-400">
        <span>{date}</span>
        {tags.length > 0 && <span>·</span>}
        <TagBreadcrumb tags={tags} />
      </div>
    </article>
  );
}
