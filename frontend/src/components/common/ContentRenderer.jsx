import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { isRTL } from '../../utils/rtl';

/**
 * Robust content renderer that handles:
 * 1. Markdown with GFM support
 * 2. LaTeX Math equations (inline and block)
 * 3. Automatic RTL/LTR detection per block
 */
const ContentRenderer = ({ content, className = '', inline = false }) => {
    if (!content) return null;

    // Detection for Hebrew/Arabic characters to help with initial alignment
    const hasRTL = isRTL(content);

    const components = {
        // Apply dir="auto" to common block elements to let the browser handle RTL per-paragraph
        p: ({ node: _node, ...props }) => <p dir="auto" className="break-words" {...props} />,
        li: ({ node: _node, ...props }) => <li dir="auto" className="break-words" {...props} />,
        h1: ({ node: _node, ...props }) => <h1 dir="auto" className="break-words" {...props} />,
        h2: ({ node: _node, ...props }) => <h2 dir="auto" className="break-words" {...props} />,
        h3: ({ node: _node, ...props }) => <h3 dir="auto" className="break-words" {...props} />,
        h4: ({ node: _node, ...props }) => <h4 dir="auto" className="break-words" {...props} />,
        h5: ({ node: _node, ...props }) => <h5 dir="auto" className="break-words" {...props} />,
        h6: ({ node: _node, ...props }) => <h6 dir="auto" className="break-words" {...props} />,
        pre: ({ node: _node, ...props }) => <pre className="overflow-x-auto max-w-full" {...props} />,
        code: ({ node: _node, inline, ...props }) => inline
            ? <code className="break-words" {...props} />
            : <code className="block overflow-x-auto" {...props} />,
        img: ({ node: _node, ...props }) => <img className="max-w-full h-auto" {...props} />,
        table: ({ node: _node, ...props }) => (
            <div className="overflow-x-auto max-w-full">
                <table {...props} />
            </div>
        ),
    };

    if (inline) {
        // For inline rendering, we wrap in a span and override the 'p' tag to also be a span
        return (
            <span dir="auto" className={className}>
                <ReactMarkdown 
                    remarkPlugins={[remarkGfm, remarkMath]} 
                    rehypePlugins={[rehypeKatex]}
                    components={{ p: ({ node: _node, ...props }) => <span {...props} /> }}
                >
                    {String(content)}
                </ReactMarkdown>
            </span>
        );
    }

    return (
        <div
            dir="auto"
            className={`content-renderer max-w-full overflow-hidden ${hasRTL ? 'rtl-content' : 'ltr-content'} ${className}`}
        >
            <ReactMarkdown 
                remarkPlugins={[remarkGfm, remarkMath]} 
                rehypePlugins={[rehypeKatex]}
                components={components}
            >
                {String(content)}
            </ReactMarkdown>
        </div>
    );
};

export default ContentRenderer;
