import { memo } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

const plugins = [remarkGfm];

export const MarkdownMessage = memo(function MarkdownMessage({
  content,
}: {
  content: string;
}) {
  return (
    <Markdown
      remarkPlugins={plugins}
      skipHtml
      components={{
        a: ({ href, children, title }) => (
          <a
            href={href}
            title={title}
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div
            className="markdown-table"
            role="region"
            aria-label="Table"
            tabIndex={0}
          >
            <table>{children}</table>
          </div>
        ),
        // Reply text can describe images without fetching arbitrary remote resources.
        img: ({ alt }) => <span className="muted">{alt || "Image"}</span>,
      }}
    >
      {content}
    </Markdown>
  );
});
