import React, { useState } from 'react';
import { Settings, LogOut, Menu, Map, BookOpen, ChevronRight, ChevronDown, X, Flame, Zap, Trophy, User, ShoppingBag } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import useCourseStore from '../../store/courseStore';
import useAuthStore from '../../store/authStore';
import CourseSidebarItem from '../dashboard/CourseSidebarItem';
import SettingsModal from './SettingsModal';
import ToastManager from '../common/ToastManager';
import useGamificationStore, { AVATARS, TITLES } from '../../store/gamificationStore';

/* ── Logo SVG ── */
const Logo = ({ size = 32 }) => (
    <div
        className="rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
            width: size, height: size,
            background: 'linear-gradient(135deg, #4F6EF7, #7C3AED)',
            boxShadow: '0 0 16px rgba(79,110,247,0.5)',
        }}
    >
        <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    </div>
);

/* ── Nav Item ── */
const NavItem = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 relative group ${
            active
                ? 'text-indigo-600 dark:text-white bg-indigo-600/10 dark:bg-indigo-500/20 border border-indigo-500/20 dark:border-indigo-500/40'
                : 'text-slate-600 dark:text-white/50 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
        }`}
    >
        {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-indigo-600 dark:bg-indigo-400" />}
        <span className={`transition-colors ${active ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-400 dark:text-white/40 group-hover:text-slate-700 dark:group-hover:text-white/70'}`}>
            {icon}
        </span>
        <span>{label}</span>
        {active && <ChevronRight size={14} className="ml-auto text-indigo-600 dark:text-indigo-400" />}
    </button>
);

const SidebarContent = ({ location, navigate, courses, selectedCourseId, setSelectedCourse, _courseUser, user, setIsSidebarOpen, setIsSettingsOpen, handleLogout }) => {
    const { activeAvatar, activeTitle, stats } = useGamificationStore();
    const [isCourseDropdownOpen, setIsCourseDropdownOpen] = React.useState(false);
    
    // Find active customizable representations
    const currentAvatar = AVATARS.find(a => a.id === activeAvatar) || { emoji: '🎓', name: 'Student' };
    const currentTitle = TITLES.find(t => t.id === activeTitle) || { name: 'Beginner' };

    return (
        <div className="flex flex-col h-full">
            {/* ── Logo ── */}
            <div className="p-6 pb-4">
                <div className="flex items-center gap-3">
                    <Logo size={36} />
                    <span className="font-display font-bold text-lg text-slate-800 dark:text-white">StudyLabs</span>
                </div>
            </div>

            {/* ── Nav Links ── */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                <div className="px-4 mb-2 text-[10px] font-bold text-slate-400 dark:text-white/25 uppercase tracking-widest">Discover</div>

                <NavItem
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
                    label="Dashboard"
                    active={location.pathname === '/'}
                    onClick={() => navigate('/')}
                />
                <NavItem
                    icon={<BookOpen size={18} />}
                    label="My Courses"
                    active={location.pathname === '/my-courses'}
                    onClick={() => navigate('/my-courses')}
                />
                <NavItem
                    icon={<Map size={18} />}
                    label="Find Courses"
                    active={location.pathname === '/enrollments'}
                    onClick={() => navigate('/enrollments')}
                />
                <NavItem
                    icon={<User size={18} />}
                    label="Profile"
                    active={location.pathname === '/profile'}
                    onClick={() => navigate('/profile')}
                />
                <NavItem
                    icon={<ShoppingBag size={18} />}
                    label="Study Shop"
                    active={location.pathname === '/shop'}
                    onClick={() => navigate('/shop')}
                />

                {/* Active Roadmap Switcher */}
                {courses.length > 0 && (() => {
                    const selectedCourse = courses.find(c => c.id === selectedCourseId) || courses[0];
                    if (!selectedCourse) return null;
                    
                    const completedNodes = selectedCourse.nodes?.filter(n => n.status === 'completed').length || 0;
                    const totalNodes = selectedCourse.nodes?.length || 0;

                    return (
                        <div className="px-3 mt-6 mb-4">
                            <div className="px-1.5 mb-2 text-[10px] font-bold text-slate-400 dark:text-white/25 uppercase tracking-widest">Active Roadmap</div>
                            
                            <div className="relative">
                                {/* Current Selector Button */}
                                <button
                                    onClick={() => setIsCourseDropdownOpen(!isCourseDropdownOpen)}
                                    className={`w-full text-left flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 ${
                                        isCourseDropdownOpen 
                                            ? 'bg-slate-100 dark:bg-white/10 border-indigo-500/30' 
                                            : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/8'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center text-xs font-black shadow-sm shrink-0">
                                            {(selectedCourse.title || '').substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-black text-slate-800 dark:text-white truncate leading-tight">
                                                {selectedCourse.title || 'Untitled Course'}
                                            </p>
                                            <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                                                {completedNodes}/{totalNodes} Stages ({selectedCourse.progress || 0}%)
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronDown 
                                        size={16} 
                                        className={`text-slate-400 transition-transform duration-300 ${isCourseDropdownOpen ? 'rotate-180' : ''}`} 
                                    />
                                </button>

                                {/* Dropdown Menu (Accordion-style for stability) */}
                                {isCourseDropdownOpen && (
                                    <div className="mt-2 p-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-white/5 rounded-2xl space-y-1 shadow-md max-h-48 overflow-y-auto custom-scrollbar">
                                        {courses.map(course => {
                                            const isCurrent = course.id === selectedCourseId;
                                            const courseCompletedNodes = course.nodes?.filter(n => n.status === 'completed').length || 0;
                                            const courseTotalNodes = course.nodes?.length || 0;

                                            return (
                                                <button
                                                    key={course.id}
                                                    onClick={() => {
                                                        setSelectedCourse(course.id);
                                                        if (location.pathname !== '/') navigate('/');
                                                        setIsCourseDropdownOpen(false);
                                                        setIsSidebarOpen(false);
                                                    }}
                                                    className={`w-full text-left p-2.5 rounded-xl transition-colors flex items-center gap-3 ${
                                                        isCurrent
                                                            ? 'bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/10 dark:border-indigo-500/20 font-black'
                                                            : 'hover:bg-slate-200/50 dark:hover:bg-white/5 text-slate-600 dark:text-white/60'
                                                    }`}
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-white/10 flex items-center justify-center text-[10px] font-black shrink-0">
                                                        {(course.title || '').substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-black truncate">{course.title || 'Untitled Course'}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 dark:text-white/30 mt-0.5">
                                                            {courseCompletedNodes}/{courseTotalNodes} Stages ({course.progress || 0}%)
                                                        </p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-white/8">
                {/* User info Card with Custom Avatar & Customizable Title */}
                <div 
                    onClick={() => {
                        navigate('/profile');
                        setIsSidebarOpen(false);
                    }}
                    className="flex items-center gap-3 px-3 py-3.5 mb-2 rounded-2xl bg-slate-100 dark:bg-white/3 border border-slate-200 dark:border-white/5 hover:bg-slate-200/50 dark:hover:bg-white/8 transition-all duration-300 cursor-pointer group/sidebar-profile"
                >
                    <div className="relative flex-shrink-0">
                        {/* Selected Customizable Emoji Avatar */}
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-2xl shadow-sm transition-transform duration-300 group-hover/sidebar-profile:scale-110 select-none">
                            {currentAvatar.emoji}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-900" />
                    </div>
                    
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-slate-800 dark:text-white truncate leading-tight">
                            {user?.name || 'Student'}
                        </p>
                        
                        {/* Customizable Title */}
                        <p className="text-[8px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest leading-none mt-1 select-none">
                            {currentTitle.name}
                        </p>
                        
                        {/* Reactive Gamification Stats from Store */}
                        <div className="flex items-center gap-2 mt-1.5">
                            <div className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400" title="Level">
                                <Trophy size={10} className="fill-emerald-500/15" />
                                <span className="text-[9px] font-black">Lvl {stats.level || 1}</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/20" />
                            <div className="flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400" title="Total XP">
                                <Zap size={10} className="fill-indigo-500/15" />
                                <span className="text-[9px] font-black">{stats.total_xp || 0}</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/20" />
                            <div className="flex items-center gap-0.5 text-orange-600 dark:text-orange-400" title="Day Streak">
                                <Flame size={10} className="fill-orange-500/15" />
                                <span className="text-[9px] font-black">{stats.streak || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="space-y-0.5">
                    {user?.roles?.includes('instructor') && (
                        <button
                            onClick={() => navigate('/instructor')}
                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-purple-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-500/15 hover:text-purple-700 dark:hover:text-purple-200 transition-all"
                        >
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            Switch to Instructor
                        </button>
                    )}
                    <button 
                        onClick={() => setIsSettingsOpen(true)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-white/40 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white/70 transition-all"
                    >
                        <Settings size={16} />Settings
                    </button>
                    <button onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500/70 dark:text-red-400/70 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all">
                        <LogOut size={16} />Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

const StudentLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { courses, selectedCourseId, setSelectedCourse, courseUser } = useCourseStore();
    const { logout, user } = useAuthStore();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const sidebarProps = { location, navigate, courses, selectedCourseId, setSelectedCourse, courseUser, user, setIsSidebarOpen, setIsSettingsOpen, handleLogout };

    return (
        <div className="min-h-screen flex font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
            {/* ── Desktop Sidebar ── */}
            <aside className="hidden md:flex flex-col w-72 sticky top-0 h-screen z-30 sidebar-theme">
                <SidebarContent {...sidebarProps} />
            </aside>

            {/* ── Mobile Overlay ── */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
                    <aside className="absolute left-0 top-0 bottom-0 w-72 sidebar-theme shadow-2xl">
                        <div className="absolute top-4 right-4 z-10">
                            <button onClick={() => setIsSidebarOpen(false)}
                                className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/60 hover:text-slate-800 dark:hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <SidebarContent {...sidebarProps} />
                    </aside>
                </div>
            )}

            {/* ── Main Content ── */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                {/* Mobile header */}
                <header className="md:hidden px-5 py-4 flex items-center justify-between sticky top-0 z-20 glass-card border-b border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-2.5">
                        <Logo size={32} />
                        <span className="font-display font-bold text-lg text-slate-800 dark:text-white">StudyLabs</span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)}
                        className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-white/80 transition-colors">
                        <Menu size={22} />
                    </button>
                </header>

                <main className="flex-1 relative page-enter">
                    {children}
                </main>
            </div>
            
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            <ToastManager />
        </div>
    );
};

export default StudentLayout;
