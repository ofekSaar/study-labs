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
        p: ({ node, ...props }) => <p dir="auto" {...props} />,
        li: ({ node, ...props }) => <li dir="auto" {...props} />,
        h1: ({ node, ...props }) => <h1 dir="auto" {...props} />,
        h2: ({ node, ...props }) => <h2 dir="auto" {...props} />,
        h3: ({ node, ...props }) => <h3 dir="auto" {...props} />,
        h4: ({ node, ...props }) => <h4 dir="auto" {...props} />,
        h5: ({ node, ...props }) => <h5 dir="auto" {...props} />,
        h6: ({ node, ...props }) => <h6 dir="auto" {...props} />,
    };

    if (inline) {
        // For inline rendering, we wrap in a span and override the 'p' tag to also be a span
        return (
            <span dir="auto" className={className}>
                <ReactMarkdown 
                    remarkPlugins={[remarkGfm, remarkMath]} 
                    rehypePlugins={[rehypeKatex]}
                    components={{ p: ({node, ...props}) => <span {...props} /> }}
                >
                    {String(content)}
                </ReactMarkdown>
            </span>
        );
    }

    return (
        <div 
            dir="auto" 
            className={`content-renderer ${hasRTL ? 'rtl-content' : 'ltr-content'} ${className}`}
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
