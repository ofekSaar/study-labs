import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';
import api from '../utils/api';
import { Loader2, Trash2, ToggleLeft, ToggleRight, Search, ChevronLeft, ChevronRight, Save, RefreshCw } from 'lucide-react';

// ── Shared helpers ──────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon, color = 'indigo' }) => (
    <div className={`bg-white dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] rounded-2xl p-5 flex items-center gap-4`}>
        <div className={`w-11 h-11 rounded-xl bg-${color}-500/10 flex items-center justify-center text-xl shrink-0`}>{icon}</div>
        <div>
            <p className="text-2xl font-black text-slate-800 dark:text-white">{value?.toLocaleString() ?? '—'}</p>
            <p className="text-xs text-slate-500 dark:text-white/40 font-medium">{label}</p>
        </div>
    </div>
);

const Pagination = ({ page, pages, onPage }) => (
    <div className="flex items-center gap-2 justify-end mt-4">
        <button onClick={() => onPage(page - 1)} disabled={page <= 1}
            className="w-8 h-8 rounded-lg border border-slate-200/60 dark:border-white/10 flex items-center justify-center disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-white/5 transition">
            <ChevronLeft size={14} />
        </button>
        <span className="text-xs text-slate-500 dark:text-white/40 font-medium">Page {page} / {pages}</span>
        <button onClick={() => onPage(page + 1)} disabled={page >= pages}
            className="w-8 h-8 rounded-lg border border-slate-200/60 dark:border-white/10 flex items-center justify-center disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-white/5 transition">
            <ChevronRight size={14} />
        </button>
    </div>
);

const ConfirmDelete = ({ label, onConfirm, onCancel }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full text-center space-y-4">
            <div className="text-4xl">🗑️</div>
            <p className="text-white font-bold text-sm">Delete {label}?</p>
            <p className="text-white/50 text-xs">This action is permanent and cannot be undone.</p>
            <div className="flex gap-3 justify-center">
                <button onClick={onCancel} className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-bold hover:bg-white/10 transition">Cancel</button>
                <button onClick={onConfirm} className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition">Delete</button>
            </div>
        </div>
    </div>
);

const ROLE_COLORS = {
    student: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    instructor: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    admin: 'bg-red-500/10 border-red-500/20 text-red-400',
};

// ── Overview ────────────────────────────────────────────────────────────────

const Overview = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/admin/stats')
            .then(res => setData(res.data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="flex items-center gap-2 text-white/40 text-sm"><Loader2 size={16} className="animate-spin" /> Loading…</div>;

    const roleMap = Object.fromEntries((data?.roleBreakdown ?? []).map(r => [r._id ?? 'none', r.count]));
    const statusMap = Object.fromEntries((data?.coursesByStatus ?? []).map(s => [s._id ?? 'unknown', s.count]));
    const maxStatus = Math.max(1, ...Object.values(statusMap));

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Users" value={data?.totalUsers} icon="👥" color="indigo" />
                <StatCard label="Total Courses" value={data?.totalCourses} icon="📚" color="purple" />
                <StatCard label="Total XP Awarded" value={data?.totalXpAwarded} icon="⚡" color="amber" />
                <StatCard label="Pending Enrollments" value={data?.pendingEnrollments} icon="📋" color="emerald" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Role breakdown */}
                <div className="bg-white dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] rounded-2xl p-5">
                    <h3 className="font-black text-slate-800 dark:text-white text-sm mb-4">Users by Role</h3>
                    {Object.entries(roleMap).map(([role, count]) => (
                        <div key={role} className="mb-3">
                            <div className="flex justify-between text-xs mb-1">
                                <span className={`font-bold capitalize px-2 py-0.5 rounded-full border text-[10px] ${ROLE_COLORS[role] ?? 'text-white/50'}`}>{role || 'No role'}</span>
                                <span className="text-slate-500 dark:text-white/40 font-bold">{count}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${(count / (data?.totalUsers || 1)) * 100}%` }} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Course status */}
                <div className="bg-white dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] rounded-2xl p-5">
                    <h3 className="font-black text-slate-800 dark:text-white text-sm mb-4">Courses by Status</h3>
                    {Object.entries(statusMap).map(([status, count]) => (
                        <div key={status} className="mb-3">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-bold text-slate-600 dark:text-white/60 capitalize">{status}</span>
                                <span className="text-slate-500 dark:text-white/40 font-bold">{count}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                                <div className="h-full rounded-full bg-purple-500" style={{ width: `${(count / maxStatus) * 100}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ── Users ────────────────────────────────────────────────────────────────────

const ALL_ROLES = ['student', 'instructor', 'admin'];

const UsersTab = () => {
    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [saving, setSaving] = useState({});

    const fetch = useCallback(async (p = page, q = search) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: p, limit: 20 });
            if (q) params.set('search', q);
            const res = await api.get(`/api/admin/users?${params}`);
            setUsers(res.data.users);
            setTotal(res.data.total);
            setPage(res.data.page);
            setPages(res.data.pages);
        } finally { setLoading(false); }
    }, [page, search]);

    useEffect(() => { fetch(1, search); }, []); // eslint-disable-line

    const handleSearch = e => {
        e.preventDefault();
        fetch(1, search);
    };

    const toggleRole = async (userId, currentRoles, role) => {
        const next = currentRoles.includes(role)
            ? currentRoles.filter(r => r !== role)
            : [...currentRoles, role];
        setSaving(s => ({ ...s, [userId]: true }));
        try {
            const res = await api.put(`/api/admin/users/${userId}/role`, { roles: next });
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, roles: res.data.user.roles } : u));
        } finally { setSaving(s => ({ ...s, [userId]: false })); }
    };

    const handleDelete = async () => {
        await api.delete(`/api/admin/users/${deleteTarget._id}`);
        setDeleteTarget(null);
        fetch(page, search);
    };

    return (
        <div className="space-y-4">
            {deleteTarget && (
                <ConfirmDelete label={deleteTarget.name} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
            )}
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name or email…"
                        className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/25 focus:outline-none focus:border-indigo-500"
                    />
                </div>
                <button type="submit" className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500 transition">Search</button>
            </form>

            <p className="text-xs text-slate-500 dark:text-white/30 font-medium">{total} users total</p>

            {loading ? (
                <div className="flex items-center gap-2 text-white/40 text-sm py-8 justify-center"><Loader2 size={16} className="animate-spin" /> Loading…</div>
            ) : (
                <div className="space-y-2">
                    {users.map(user => (
                        <div key={user._id} className="bg-white dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="font-black text-slate-800 dark:text-white text-sm truncate">{user.name}</p>
                                <p className="text-xs text-slate-400 dark:text-white/35 truncate">{user.email}</p>
                                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                    {(user.roles?.length ? user.roles : (user.role ? [user.role] : ['no role'])).map(r => (
                                        <span key={r} className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${ROLE_COLORS[r] ?? 'border-white/10 text-white/30'}`}>{r}</span>
                                    ))}
                                    <span className="text-[10px] text-slate-400 dark:text-white/30">🪙 {user.coins ?? 0}</span>
                                    <span className="text-[10px] text-slate-400 dark:text-white/30">⚡ {user.stats?.total_xp ?? 0} XP</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                {ALL_ROLES.map(role => {
                                    const has = (user.roles ?? []).includes(role);
                                    return (
                                        <button
                                            key={role}
                                            onClick={() => toggleRole(user._id, user.roles ?? [], role)}
                                            disabled={saving[user._id]}
                                            className={`text-[10px] font-black uppercase px-2.5 py-1.5 rounded-xl border transition ${
                                                has
                                                    ? ROLE_COLORS[role] + ' opacity-100'
                                                    : 'border-white/10 text-white/20 hover:text-white/50 hover:border-white/20'
                                            }`}
                                        >
                                            {has ? '✓ ' : ''}{role}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => setDeleteTarget(user)}
                                    className="w-8 h-8 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 flex items-center justify-center transition"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {pages > 1 && <Pagination page={page} pages={pages} onPage={p => fetch(p, search)} />}
        </div>
    );
};

// ── Courses ───────────────────────────────────────────────────────────────────

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

    const fetch = useCallback(async (p = page, q = search) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: p, limit: 20 });
            if (q) params.set('search', q);
            const res = await api.get(`/api/admin/courses?${params}`);
            setCourses(res.data.courses);
            setTotal(res.data.total);
            setPage(res.data.page);
            setPages(res.data.pages);
        } finally { setLoading(false); }
    }, [page, search]);

    useEffect(() => { fetch(1, ''); }, []); // eslint-disable-line

    const handleSearch = e => { e.preventDefault(); fetch(1, search); };

    const togglePublish = async (courseId, _current) => {
        setToggling(t => ({ ...t, [courseId]: true }));
        try {
            const res = await api.put(`/api/admin/courses/${courseId}/publish`);
            setCourses(prev => prev.map(c => c._id === courseId ? { ...c, isPublished: res.data.isPublished } : c));
        } finally { setToggling(t => ({ ...t, [courseId]: false })); }
    };

    const handleDelete = async () => {
        await api.delete(`/api/admin/courses/${deleteTarget._id}`);
        setDeleteTarget(null);
        fetch(page, search);
    };

    return (
        <div className="space-y-4">
            {deleteTarget && (
                <ConfirmDelete label={deleteTarget.title} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
            )}
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search courses…"
                        className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/5 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/25 focus:outline-none focus:border-indigo-500"
                    />
                </div>
                <button type="submit" className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500 transition">Search</button>
            </form>

            <p className="text-xs text-slate-500 dark:text-white/30 font-medium">{total} courses total</p>

            {loading ? (
                <div className="flex items-center gap-2 text-white/40 text-sm py-8 justify-center"><Loader2 size={16} className="animate-spin" /> Loading…</div>
            ) : (
                <div className="space-y-2">
                    {courses.map(course => (
                        <div key={course._id} className="bg-white dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="font-black text-slate-800 dark:text-white text-sm truncate">{course.title}</p>
                                <p className="text-xs text-slate-400 dark:text-white/35 truncate">by {course.instructor?.name ?? 'Unknown'}</p>
                                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${STATUS_COLORS[course.generationStatus] ?? 'text-white/40 border-white/10'}`}>
                                        {course.generationStatus}
                                    </span>
                                    <span className="text-[10px] text-slate-400 dark:text-white/30">👥 {course.enrolledCount} enrolled</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() => togglePublish(course._id, course.isPublished)}
                                    disabled={toggling[course._id]}
                                    className={`flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl border transition ${
                                        course.isPublished
                                            ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10 hover:bg-emerald-400/20'
                                            : 'text-white/30 border-white/10 hover:bg-white/5'
                                    }`}
                                >
                                    {toggling[course._id]
                                        ? <Loader2 size={11} className="animate-spin" />
                                        : course.isPublished ? <ToggleRight size={13} /> : <ToggleLeft size={13} />
                                    }
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
            {pages > 1 && <Pagination page={page} pages={pages} onPage={p => fetch(p, search)} />}
        </div>
    );
};

// ── Shop Prices ───────────────────────────────────────────────────────────────

const PRICE_LABELS = {
    avatars: { wizard_scholar: 'Wizard Scholar', cyber_learner: 'Cyber Learner', unicorn_scholar: 'Academic Unicorn' },
    titles: { knowledge_alchemist: 'Alchemist of Knowledge', ultimate_mind: 'Ultimate Mind', legendary_scholar: 'Legendary Scholar' },
    themes: { arcade: 'Retro Arcade', space: 'Space Nebula', cyberpunk: 'Neon Cyberpunk' },
    frames: { bronze: 'Bronze Glow', silver: 'Silver Glow', gold: 'Gold Shine', diamond: 'Diamond Sparkle' },
    powerups: { streak_shield: 'Streak Shield', xp_boost: 'XP Boost Token', weekend_freeze: 'Weekend Freeze' },
};

const ShopPricesTab = () => {
    const [prices, setPrices] = useState(null);
    const [draft, setDraft] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        api.get('/api/admin/shop/prices')
            .then(res => { setPrices(res.data.prices); setDraft(structuredClone(res.data.prices)); })
            .finally(() => setLoading(false));
    }, []);

    const handleChange = (cat, key, val) => {
        setDraft(prev => ({ ...prev, [cat]: { ...prev[cat], [key]: parseInt(val) || 0 } }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.put('/api/admin/shop/prices', { prices: draft });
            setPrices(res.data.prices);
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } finally { setSaving(false); }
    };

    const handleReset = () => setDraft(structuredClone(prices));

    if (loading) return <div className="flex items-center gap-2 text-white/40 text-sm py-8 justify-center"><Loader2 size={16} className="animate-spin" /> Loading…</div>;

    return (
        <div className="space-y-5 max-w-xl">
            {Object.entries(draft ?? {}).map(([cat, items]) => (
                <div key={cat} className="bg-white dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] rounded-2xl p-5">
                    <h3 className="font-black text-slate-700 dark:text-white/60 text-xs uppercase tracking-widest mb-4 capitalize">{cat}</h3>
                    <div className="space-y-3">
                        {Object.entries(items).map(([key, val]) => (
                            <div key={key} className="flex items-center justify-between gap-4">
                                <label className="text-sm font-bold text-slate-700 dark:text-white/70 flex-1">
                                    {PRICE_LABELS[cat]?.[key] ?? key}
                                </label>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-amber-500 text-sm">🪙</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={val}
                                        onChange={e => handleChange(cat, key, e.target.value)}
                                        className="w-20 text-right px-2 py-1.5 text-sm font-black rounded-lg border border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            <div className="flex items-center gap-3">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black transition disabled:opacity-60"
                >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {saved ? '✓ Saved!' : 'Save Prices'}
                </button>
                <button onClick={handleReset} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-white/10 text-slate-500 dark:text-white/40 text-sm font-bold hover:bg-slate-100 dark:hover:bg-white/5 transition">
                    <RefreshCw size={13} /> Reset
                </button>
            </div>
        </div>
    );
};

// ── Router ───────────────────────────────────────────────────────────────────

const SECTION_LABELS = {
    '/admin': 'Overview',
    '/admin/users': 'User Management',
    '/admin/courses': 'Course Management',
    '/admin/shop': 'Shop Prices',
};

const AdminPage = () => {
    const section = SECTION_LABELS[window.location.pathname] ?? 'Admin';

    return (
        <AdminLayout section={section}>
            <Routes>
                <Route index element={<Overview />} />
                <Route path="users" element={<UsersTab />} />
                <Route path="courses" element={<CoursesTab />} />
                <Route path="shop" element={<ShopPricesTab />} />
            </Routes>
        </AdminLayout>
    );
};

export default AdminPage;
