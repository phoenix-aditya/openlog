interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div
      className="
        text-gray-800 dark:text-gray-200 leading-relaxed text-base
        [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:text-gray-900 dark:[&_h1]:text-white
        [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-gray-900 dark:[&_h2]:text-white
        [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-gray-900 dark:[&_h3]:text-white
        [&_p]:mb-4
        [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4
        [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4
        [&_li]:mb-1
        [&_blockquote]:border-l-4 [&_blockquote]:border-gray-200 dark:[&_blockquote]:border-gray-700 [&_blockquote]:pl-4 [&_blockquote]:text-gray-500 dark:[&_blockquote]:text-gray-400 [&_blockquote]:italic [&_blockquote]:my-4
        [&_code]:bg-gray-100 dark:[&_code]:bg-gray-800 [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_code]:font-mono
        [&_pre]:bg-gray-100 dark:[&_pre]:bg-gray-800 [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:mb-4
        [&_pre_code]:bg-transparent [&_pre_code]:p-0
        [&_a]:text-gray-900 dark:[&_a]:text-gray-200 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-gray-600 dark:hover:[&_a]:text-white
        [&_hr]:border-gray-100 dark:[&_hr]:border-gray-800 [&_hr]:my-6
        [&_img]:rounded-lg [&_img]:max-w-full
        [&_strong]:font-semibold [&_strong]:text-gray-900 dark:[&_strong]:text-white
        [&_em]:italic
      "
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
