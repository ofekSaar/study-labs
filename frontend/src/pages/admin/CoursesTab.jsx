import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Trash2, ToggleLeft, ToggleRight, Search } from 'lucide-react';
import api from '../../utils/api';
import Pagination from '../../components/common/Pagination';
import ConfirmDeleteModal from '../../components/common/ConfirmDeleteModal';

const PAGE_LIMIT = 20;

const STATUS_COLORS = {
    ready: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10',
    generating: 'text-amber-400 border-amber-400/20 bg-amber-400/10',
    failed: 'text-red-400 border-red-400/20 bg-red-400/10',
};

const CoursesTab = () => {
    const [courses, setCourses] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [toggling, setToggling] = useState({});

    const fetchCourses = useCallback(
        async (p = page, q = search) => {
            setLoading(true);
            try {
                const params = new URLSearchParams({ page: p, limit: PAGE_LIMIT });
                if (q) params.set('search', q);
                const res = await api.get(`/api/admin/courses?${params}`);
                setCourses(res.data.courses);
                setTotal(res.data.total);
                setPage(res.data.page);
                setPages(res.data.pages);
            } finally {
                setLoading(false);
            }
        },
        [page, search]
    );

    useEffect(() => {
        fetchCourses(1, '');
    }, []); // eslint-disable-line

    const handleSearch = (e) => {
        e.preventDefault();
        fetchCourses(1, search);
    };

    const togglePublish = async (courseId) => {
        setToggling((t) => ({ ...t, [courseId]: true }));
        try {
            const res = await api.put(`/api/admin/courses/${courseId}/publish`);
            setCourses((prev) =>
                prev.map((c) =>
                    c._id === courseId ? { ...c, isPublished: res.data.isPublished } : c
                )
            );
        } finally {
            setToggling((t) => ({ ...t, [courseId]: false }));
        }
    };

    const handleDelete = async () => {
        await api.delete(`/api/admin/courses/${deleteTarget._id}`);
        setDeleteTarget(null);
        fetchCourses(page, search);
    };

    return (
        <div className="space-y-4">
            {deleteTarget && (
                <ConfirmDeleteModal
                    label={deleteTarget.title}
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}

            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search courses…"
                        className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/25 focus:outline-none focus:border-indigo-500"
                    />
                </div>
                <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500 transition"
                >
                    Search
                </button>
            </form>

            <p className="text-xs text-slate-500 dark:text-white/30 font-medium">
                {total} courses total
            </p>

            {loading ? (
                <div className="flex items-center gap-2 text-white/40 text-sm py-8 justify-center">
                    <Loader2 size={16} className="animate-spin" /> Loading…
                </div>
            ) : (
                <div className="space-y-2">
                    {courses.map((course) => (
                        <div
                            key={course._id}
                            className="bg-white dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                            <div className="min-w-0">
                                <p className="font-black text-slate-800 dark:text-white text-sm truncate">
                                    {course.title}
                                </p>
                                <p className="text-xs text-slate-400 dark:text-white/35 truncate">
                                    by {course.instructor?.name ?? 'Unknown'}
                                </p>
                                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                    <span
                                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${STATUS_COLORS[course.generationStatus] ?? 'text-white/40 border-white/10'}`}
                                    >
                                        {course.generationStatus}
                                    </span>
                                    <span className="text-[10px] text-slate-400 dark:text-white/30">
                                        👥 {course.enrolledCount} enrolled
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() => togglePublish(course._id)}
                                    disabled={toggling[course._id]}
                                    className={`flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl border transition ${
                                        course.isPublished
                                            ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10 hover:bg-emerald-400/20'
                                            : 'text-white/30 border-white/10 hover:bg-white/5'
                                    }`}
                                >
                                    {toggling[course._id] ? (
                                        <Loader2 size={11} className="animate-spin" />
                                    ) : course.isPublished ? (
                                        <ToggleRight size={13} />
                                    ) : (
                                        <ToggleLeft size={13} />
                                    )}
                                    {course.isPublished ? 'Published' : 'Unpublished'}
                                </button>
                                <button
                                    onClick={() => setDeleteTarget(course)}
                                    className="w-8 h-8 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 flex items-center justify-center transition"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {pages > 1 && (
                <Pagination page={page} pages={pages} onPage={(p) => fetchCourses(p, search)} />
            )}
        </div>
    );
};

export default CoursesTab;
