import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, BookOpen, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Spinner from './Spinner';

const DEPT_COLORS = {
    cs: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    math: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    physics: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    bio: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    other: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
};

const GlobalSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef(null);
    const wrapperRef = useRef(null);
    const timerRef = useRef(null);
    const navigate = useNavigate();

    const search = useCallback(async (q) => {
        if (!q.trim()) {
            setResults([]);
            setIsOpen(false);
            return;
        }
        setIsLoading(true);
        try {
            const { data } = await api.get(`/api/courses/search?q=${encodeURIComponent(q)}`);
            setResults(data.courses || []);
            setIsOpen(true);
        } catch {
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => search(query), 300);
        return () => clearTimeout(timerRef.current);
    }, [query, search]);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSelect = (course) => {
        setQuery('');
        setIsOpen(false);
        // Navigate to enrollment page filtered to this course
        navigate(`/enrollments?search=${encodeURIComponent(course.title)}`);
    };

    return (
        <div ref={wrapperRef} className="relative w-full max-w-xs">
            <div
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                    isOpen || query
                        ? 'bg-white dark:bg-slate-900 border-orange-500/40 shadow-lg shadow-orange-500/10'
                        : 'bg-slate-100 dark:bg-white/5 border-transparent hover:border-slate-200 dark:hover:border-white/10'
                }`}
            >
                {isLoading ? (
                    <Spinner size="sm" label="Searching" />
                ) : (
                    <Search size={15} className="text-slate-400 dark:text-white/30 flex-shrink-0" />
                )}
                <input
                    ref={inputRef}
                    type="text"
                    aria-label="Search courses"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                        if (results.length > 0) setIsOpen(true);
                    }}
                    placeholder="Search courses..."
                    className="flex-1 bg-transparent text-xs font-medium text-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-white/25 focus:outline-none min-w-0"
                />
                {query && (
                    <button
                        onClick={() => {
                            setQuery('');
                            setResults([]);
                            setIsOpen(false);
                            inputRef.current?.focus();
                        }}
                        aria-label="Clear search"
                    >
                        <X
                            size={13}
                            className="text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60 transition-colors"
                        />
                    </button>
                )}
            </div>

            {/* Results dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    {results.length === 0 ? (
                        <div className="px-4 py-5 text-center">
                            <p className="text-xs text-slate-400 dark:text-white/30 font-medium">
                                No courses found for "{query}"
                            </p>
                        </div>
                    ) : (
                        <div className="py-1 max-h-72 overflow-y-auto">
                            {results.map((course) => (
                                <button
                                    key={course._id}
                                    onClick={() => handleSelect(course)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 text-left transition-colors"
                                >
                                    <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                                        <BookOpen size={15} className="text-orange-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                                            {course.title}
                                        </p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span
                                                className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${DEPT_COLORS[course.department] || DEPT_COLORS.other}`}
                                            >
                                                {course.department?.toUpperCase()}
                                            </span>
                                            {course.instructor?.name && (
                                                <span className="text-[9px] text-slate-400 dark:text-white/30 truncate">
                                                    by {course.instructor.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;
