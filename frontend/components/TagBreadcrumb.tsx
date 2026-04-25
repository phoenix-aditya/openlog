interface TagBreadcrumbProps {
  tags: Array<{ name: string }>;
}

export default function TagBreadcrumb({ tags }: TagBreadcrumbProps) {
  if (!tags || tags.length === 0) return null;
  return (
    <span className="text-sm text-gray-400">
      {tags.map((tag, i) => (
        <span key={tag.name}>
          {i > 0 && <span className="mx-1 text-gray-300">/</span>}
          <span className="bg-gray-100 text-gray-600 rounded px-1.5 py-0.5 text-xs font-medium">{tag.name}</span>
        </span>
      ))}
    </span>
  );
}
