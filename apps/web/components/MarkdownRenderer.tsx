'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-invert prose-neon max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-white mb-4 border-b border-neon-500/30 pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold text-neon-400 mb-3">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-neon-300 mb-2">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-medium text-neon-200 mb-2">
              {children}
            </h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-sm font-medium text-neon-100 mb-1">
              {children}
            </h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-xs font-medium text-neon-100 mb-1">
              {children}
            </h6>
          ),
          
          p: ({ children }) => (
            <p className="text-dark-200 mb-3 leading-relaxed">
              {children}
            </p>
          ),
          
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-dark-200 mb-3 space-y-1 ml-4">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-dark-200 mb-3 space-y-1 ml-4">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-dark-200">
              {children}
            </li>
          ),
          
          strong: ({ children }) => (
            <strong className="font-semibold text-neon-300">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-neon-200">
              {children}
            </em>
          ),
          
          code: ({ children, className }) => {
            const isInline = !className
            if (isInline) {
              return (
                <code className="bg-dark-800 text-neon-400 px-1 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              )
            }
            return (
              <code className="bg-dark-800 text-neon-400 px-2 py-1 rounded text-sm font-mono block">
                {children}
              </code>
            )
          },
          pre: ({ children }) => (
            <pre className="bg-dark-800 border border-dark-600 rounded-lg p-4 overflow-x-auto mb-3">
              {children}
            </pre>
          ),
          
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-neon-500/50 pl-4 py-2 bg-neon-500/5 italic text-dark-300 mb-3">
              {children}
            </blockquote>
          ),
          
          a: ({ children, href }) => (
            <a 
              href={href} 
              className="text-neon-400 hover:text-neon-300 underline transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          
          table: ({ children }) => (
            <div className="overflow-x-auto mb-3">
              <table className="min-w-full border border-dark-600 rounded-lg">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-dark-800">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="bg-dark-900/50">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="border-b border-dark-600">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 text-left text-white font-medium border-r border-dark-600">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 text-dark-200 border-r border-dark-600">
              {children}
            </td>
          ),
          
          
          hr: () => (
            <hr className="border-t border-dark-600 my-6" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
} 