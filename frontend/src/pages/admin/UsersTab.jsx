import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Trash2, Search } from 'lucide-react';
import api from '../../utils/api';
import Pagination from '../../components/common/Pagination';
import ConfirmDeleteModal from '../../components/common/ConfirmDeleteModal';

const PAGE_LIMIT = 20;

const ROLE_COLORS = {
    student: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    instructor: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    admin: 'bg-red-500/10 border-red-500/20 text-red-400',
};

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

    const fetchUsers = useCallback(
        async (p = page, q = search) => {
            setLoading(true);
            try {
                const params = new URLSearchParams({ page: p, limit: PAGE_LIMIT });
                if (q) params.set('search', q);
                const res = await api.get(`/api/admin/users?${params}`);
                setUsers(res.data.users);
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
        fetchUsers(1, search);
    }, []); // eslint-disable-line

    const handleSearch = (e) => {
        e.preventDefault();
        fetchUsers(1, search);
    };

    const toggleRole = async (userId, currentRoles, role) => {
        const next = currentRoles.includes(role)
            ? currentRoles.filter((r) => r !== role)
            : [...currentRoles, role];
        setSaving((s) => ({ ...s, [userId]: true }));
        try {
            const res = await api.put(`/api/admin/users/${userId}/role`, { roles: next });
            setUsers((prev) =>
                prev.map((u) => (u._id === userId ? { ...u, roles: res.data.user.roles } : u))
            );
        } finally {
            setSaving((s) => ({ ...s, [userId]: false }));
        }
    };

    const handleDelete = async () => {
        await api.delete(`/api/admin/users/${deleteTarget._id}`);
        setDeleteTarget(null);
        fetchUsers(page, search);
    };

    return (
        <div className="space-y-4">
            {deleteTarget && (
                <ConfirmDeleteModal
                    label={deleteTarget.name}
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
                        placeholder="Search by name or email…"
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
                {total} users total
            </p>

            {loading ? (
                <div className="flex items-center gap-2 text-white/40 text-sm py-8 justify-center">
                    <Loader2 size={16} className="animate-spin" /> Loading…
                </div>
            ) : (
                <div className="space-y-2">
                    {users.map((user) => (
                        <div
                            key={user._id}
                            className="bg-white dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                            <div className="min-w-0">
                                <p className="font-black text-slate-800 dark:text-white text-sm truncate">
                                    {user.name}
                                </p>
                                <p className="text-xs text-slate-400 dark:text-white/35 truncate">
                                    {user.email}
                                </p>
                                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                    {(user.roles?.length
                                        ? user.roles
                                        : user.role
                                          ? [user.role]
                                          : ['no role']
                                    ).map((r) => (
                                        <span
                                            key={r}
                                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${ROLE_COLORS[r] ?? 'border-white/10 text-white/30'}`}
                                        >
                                            {r}
                                        </span>
                                    ))}
                                    <span className="text-[10px] text-slate-400 dark:text-white/30">
                                        🪙 {user.coins ?? 0}
                                    </span>
                                    <span className="text-[10px] text-slate-400 dark:text-white/30">
                                        ⚡ {user.stats?.total_xp ?? 0} XP
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                {ALL_ROLES.map((role) => {
                                    const has = (user.roles ?? []).includes(role);
                                    return (
                                        <button
                                            key={role}
                                            onClick={() =>
                                                toggleRole(user._id, user.roles ?? [], role)
                                            }
                                            disabled={saving[user._id]}
                                            className={`text-[10px] font-black uppercase px-2.5 py-1.5 rounded-xl border transition ${
                                                has
                                                    ? ROLE_COLORS[role] + ' opacity-100'
                                                    : 'border-white/10 text-white/20 hover:text-white/50 hover:border-white/20'
                                            }`}
                                        >
                                            {has ? '✓ ' : ''}
                                            {role}
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

            {pages > 1 && (
                <Pagination page={page} pages={pages} onPage={(p) => fetchUsers(p, search)} />
            )}
        </div>
    );
};

export default UsersTab;
