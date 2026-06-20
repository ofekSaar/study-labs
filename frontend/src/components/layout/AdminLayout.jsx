import React from 'react';
import { NavLink } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { BarChart2, Users, BookOpen, ShoppingBag, Shield } from 'lucide-react';

const NAV_ITEMS = [
    { to: '/admin', label: 'Overview', icon: BarChart2, end: true },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/courses', label: 'Courses', icon: BookOpen },
    { to: '/admin/shop', label: 'Shop Prices', icon: ShoppingBag },
];

const AdminLayout = ({ children, section }) => {
    const { user } = useAuthStore();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
            {/* Top bar */}
            <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200/60 dark:border-white/[0.06] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <Shield size={14} className="text-red-500" />
                    </div>
                    <span className="font-black text-slate-800 dark:text-white text-sm">Admin Panel</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-white/40">{user?.name}</span>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <nav className="hidden md:flex flex-col w-52 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200/60 dark:border-white/[0.06] p-3 gap-1">
                    {NAV_ITEMS.map((navItem) => {
                        const NavIcon = navItem.icon;
                        return (
                            <NavLink
                                key={navItem.to}
                                to={navItem.to}
                                end={navItem.end}
                                className={({ isActive }) =>
                                    `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                        isActive
                                            ? 'bg-orange-500 text-white shadow-md'
                                            : 'text-slate-600 dark:text-white/50 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                                    }`
                                }
                            >
                                <NavIcon size={16} />
                                {navItem.label}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Mobile tab bar */}
                <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200/60 dark:border-white/[0.06] flex">
                    {NAV_ITEMS.map((navItem) => {
                        const NavIcon = navItem.icon;
                        return (
                        <NavLink
                            key={navItem.to}
                            to={navItem.to}
                            end={navItem.end}
                            className={({ isActive }) =>
                                `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold transition-all ${
                                    isActive ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400 dark:text-white/30'
                                }`
                            }
                        >
                            <NavIcon size={18} />
                            {navItem.label}
                        </NavLink>
                        );
                    })}
                </div>

                {/* Main content */}
                <main className="flex-1 overflow-y-auto p-5 pb-24 md:pb-6">
                    {section && (
                        <h2 className="text-xl font-black text-slate-800 dark:text-white mb-5">{section}</h2>
                    )}
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
