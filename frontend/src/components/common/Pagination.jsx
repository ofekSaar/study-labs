import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ page, pages, onPage }) => (
    <nav className="flex items-center gap-2 justify-end mt-4" aria-label="Pagination">
        <button
            type="button"
            onClick={() => onPage(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
            className="w-8 h-8 rounded-lg border border-slate-200/60 dark:border-white/10 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 transition"
        >
            <ChevronLeft size={14} />
        </button>
        <span className="text-xs text-slate-500 dark:text-white/40 font-medium" aria-current="page">
            Page {page} / {pages}
        </span>
        <button
            type="button"
            onClick={() => onPage(page + 1)}
            disabled={page >= pages}
            aria-label="Next page"
            className="w-8 h-8 rounded-lg border border-slate-200/60 dark:border-white/10 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 transition"
        >
            <ChevronRight size={14} />
        </button>
    </nav>
);

export default Pagination;
