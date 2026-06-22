import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import InstructorLayout from '../components/layout/InstructorLayout';
import useCourseStore from '../store/courseStore';
import useEnrollmentStore from '../store/enrollmentStore';
import { getDeptStyle } from '../utils/departmentStyles';
import {
    Search, BookOpen, Users, ArrowRight, Loader2, Trash2,
    Zap, Star, Layers, Check, X, Clock, AlertCircle,
    UserCheck, ChevronDown, Pencil, Save
} from 'lucide-react';

const COURSE_AVATARS = [
    '📚', '💻', '🔬', '🧮', '⚛️', '🧬', '🎨', '🌍',
    '🏛️', '✍️', '🎵', '🏃', '💼', '🔭', '🧪', '📊',
    '🌐', '🤖', '🏗️', '📐', '🧠', '🎯', '🌿', '🎭',
];

const LEVEL_CONFIG = {
    beginner:     { label: 'Beginner',     emoji: '🌱', color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    intermediate: { label: 'Intermediate', emoji: '⚡', color: 'text-amber-500',   bg: 'bg-amber-500/10   border-amber-500/20'   },
    advanced:     { label: 'Advanced',     emoji: '🔥', color: 'text-red-500',     bg: 'bg-red-500/10     border-red-500/20'     },
};

// ─── Edit Course Modal ─────────────────────────────────────────────────────────

const EditCourseModal = ({ course, onClose, onSave }) => {
    const { updateCourse } = useCourseStore();
    const [title, setTitle] = useState(course.title || '');
    const [description, setDescription] = useState(course.description || '');
    const [avatar, setAvatar] = useState(course.courseAvatar || '📚');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        if (!title.trim()) { setError('Title is required'); return; }
        if (description.trim().length < 10) { setError('Description must be at least 10 characters'); return; }
        setSaving(true);
        setError('');
        try {
            await updateCourse(course.id || course._id, { title: title.trim(), description: description.trim(), courseAvatar: avatar });
            onSave();
        } catch (err) {
            setError(err.message || 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
                className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                            <Pencil size={16} className="text-purple-500" />
                        </div>
                        <h2 className="text-lg font-black text-slate-800 dark:text-white">Edit Course</h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-white/50 hover:text-slate-800 dark:hover:text-white transition-colors">
                        <X size={16} />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
                    {/* Avatar picker */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider mb-3">Course Avatar</label>
                        <div className="grid grid-cols-8 gap-2">
                            {COURSE_AVATARS.map((em) => (
                                <button
                                    key={em}
                                    onClick={() => setAvatar(em)}
                                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all border-2 ${
                                        avatar === em
                                            ? 'border-purple-500 bg-purple-500/10 scale-110 shadow-md'
                                            : 'border-transparent bg-slate-100 dark:bg-white/5 hover:border-purple-500/40 hover:scale-105'
                                    }`}
                                    title={em}
                                >
                                    {em}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider mb-2">Course Title</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={200}
                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white font-semibold focus:border-purple-500 focus:outline-none focus:bg-white dark:focus:bg-white/10 transition-all text-sm"
                            placeholder="Course title…"
                        />
                        <p className="text-right text-xs text-slate-400 dark:text-white/30 mt-1">{title.length}/200</p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-white/50 uppercase tracking-wider mb-2">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={2000}
                            rows={4}
                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white text-sm font-medium focus:border-purple-500 focus:outline-none focus:bg-white dark:focus:bg-white/10 transition-all resize-none leading-relaxed"
                            placeholder="Course description…"
                        />
                        <p className="text-right text-xs text-slate-400 dark:text-white/30 mt-1">{description.length}/2000</p>
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 font-semibold px-1">{error}</p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-white/10">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-bold shadow-[0_4px_14px_rgba(124,58,237,0.35)] hover:shadow-[0_6px_20px_rgba(124,58,237,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
                    >
                        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Enrollment Tab ────────────────────────────────────────────────────────────

const EnrollmentTab = ({ courses, preselectedCourseId }) => {
    const { courseEnrollments, fetchCourseEnrollments, approveEnrollment, denyEnrollment, isLoading } = useEnrollmentStore();
    const [selectedCourseId, setSelectedCourseId] = useState(preselectedCourseId || '');
    const [statusFilter, setStatusFilter] = useState('pending');
    const [isActioning, setIsActioning] = useState(null);

    useEffect(() => {
        if (preselectedCourseId) setSelectedCourseId(preselectedCourseId);
    }, [preselectedCourseId]);

    useEffect(() => {
        if (courses.length > 0 && !selectedCourseId) {
            setSelectedCourseId(courses[0].id);
        }
    }, [courses, selectedCourseId]);

    useEffect(() => {
        if (selectedCourseId) {
            fetchCourseEnrollments(selectedCourseId, statusFilter === 'all' ? '' : statusFilter);
        }
    }, [selectedCourseId, statusFilter, fetchCourseEnrollments]);

    const handleApprove = async (id) => {
        setIsActioning(id);
        try { await approveEnrollment(id); } catch { /* handled */ }
        finally { setIsActioning(null); }
    };

    const handleDeny = async (id) => {
        setIsActioning(id);
        try { await denyEnrollment(id); } catch { /* handled */ }
        finally { setIsActioning(null); }
    };

    const selectedCourse = courses.find(c => c.id === selectedCourseId);

    return (
        <div className="space-y-6">
            {/* Controls row */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                {/* Course picker */}
                <div className="relative flex-1 sm:max-w-xs">
                    <select
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-black/30 backdrop-blur-md text-slate-800 dark:text-white text-sm font-semibold focus:border-purple-500 focus:outline-none transition-all shadow-sm cursor-pointer"
                    >
                        <option value="" disabled>Select a course…</option>
                        {courses.map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                {/* Status filter */}
                <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-1 rounded-xl backdrop-blur-sm">
                    {['pending', 'all'].map(f => (
                        <button
                            key={f}
                            onClick={() => setStatusFilter(f)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize ${
                                statusFilter === f
                                    ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-500 dark:text-white/50 hover:text-slate-700 dark:hover:text-white/80'
                            }`}
                        >
                            {f === 'all' ? 'All History' : 'Pending'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Selected course summary */}
            {selectedCourse && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-purple-500/8 border border-purple-500/15">
                    <BookOpen size={16} className="text-purple-500 flex-shrink-0" />
                    <span className="text-sm font-bold text-slate-700 dark:text-white/80">{selectedCourse.title}</span>
                    <span className="ml-auto text-xs text-slate-400 dark:text-white/40 font-medium">{selectedCourse.department || 'General'}</span>
                </div>
            )}

            {/* Table */}
            <div className="bg-white/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-3xl overflow-hidden backdrop-blur-md shadow-sm">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
                    </div>
                ) : !selectedCourseId ? (
                    <div className="text-center py-20 px-6">
                        <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
                            <UserCheck size={28} className="text-purple-400" />
                        </div>
                        <p className="text-slate-500 dark:text-white/50 font-medium">Select a course to view enrollment requests.</p>
                    </div>
                ) : courseEnrollments.length === 0 ? (
                    <div className="text-center py-20 px-6">
                        <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
                            <AlertCircle size={28} className="text-slate-400" />
                        </div>
                        <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">No requests found</h3>
                        <p className="text-slate-500 dark:text-white/50 text-sm">
                            There are no {statusFilter === 'pending' ? 'pending ' : ''}enrollment requests for this course.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-slate-100 dark:border-white/10">
                                <tr className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-white/40">
                                    <th className="px-6 py-4">Student</th>
                                    <th className="px-6 py-4">Requested</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {courseEnrollments.map((req) => (
                                    <tr key={req._id} className="hover:bg-slate-50/60 dark:hover:bg-white/3 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={req.student?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.student?.name || 'S')}&background=7C3AED&color=fff`}
                                                    alt="Avatar"
                                                    className="w-9 h-9 rounded-full border border-slate-200 dark:border-white/10 object-cover"
                                                />
                                                <div>
                                                    <div className="font-bold text-slate-800 dark:text-white">{req.student?.name}</div>
                                                    <div className="text-slate-400 dark:text-white/40 text-xs">{req.student?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-slate-400 dark:text-white/40 text-sm">
                                                <Clock size={13} />
                                                {new Date(req.requestedAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {req.status === 'pending'  && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> Pending</span>}
                                            {req.status === 'approved' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Approved</span>}
                                            {req.status === 'denied'   && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-500"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Denied</span>}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {req.status === 'pending' ? (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleDeny(req._id)}
                                                        disabled={isActioning === req._id}
                                                        className="w-8 h-8 rounded-xl flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-colors disabled:opacity-40"
                                                        title="Deny"
                                                    >
                                                        {isActioning === req._id ? <Loader2 size={14} className="animate-spin" /> : <X size={15} />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleApprove(req._id)}
                                                        disabled={isActioning === req._id}
                                                        className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-colors disabled:opacity-40"
                                                        title="Approve"
                                                    >
                                                        {isActioning === req._id ? <Loader2 size={14} className="animate-spin" /> : <Check size={15} strokeWidth={3} />}
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 dark:text-white/30 uppercase font-bold tracking-wider">Resolved</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

const ManagedCourses = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { courses, fetchAllCourses, deleteCourse, isLoading } = useCourseStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const [enrollmentCourseId, setEnrollmentCourseId] = useState(null);
    const [editingCourse, setEditingCourse] = useState(null);

    const activeTab = searchParams.get('tab') || 'courses';

    const setTab = (tab) => {
        setSearchParams(tab === 'courses' ? {} : { tab });
        if (tab === 'courses') setEnrollmentCourseId(null);
    };

    useEffect(() => {
        fetchAllCourses();
    }, [fetchAllCourses]);

    const handleDelete = async (courseId, courseTitle) => {
        if (!window.confirm(`Are you sure you want to delete "${courseTitle}"? This action cannot be undone.`)) return;
        setDeletingId(courseId);
        try { await deleteCourse(courseId); } catch (error) { alert('Failed to delete course: ' + (error.message || 'Unknown error')); }
        finally { setDeletingId(null); }
    };

    const openEnrollments = (courseId) => {
        setEnrollmentCourseId(courseId);
        setTab('enrollments');
    };

    const filteredCourses = courses.filter(course =>
        course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <InstructorLayout title="Managed Courses">
            {/* Ambient background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 dot-grid opacity-60" />
                <div className="absolute top-0 right-0 w-96 h-96 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
                <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full"
                    style={{ background: 'radial-gradient(circle, rgba(217,119,87,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />
            </div>

            <div className="relative z-[1] max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8 pb-32 animate-fade-in">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-slate-800 dark:text-white drop-shadow-sm dark:drop-shadow-md tracking-tight">Managed Courses</h1>
                        <p className="text-slate-500 dark:text-white/60 text-lg mt-1 font-medium">View, search, and manage all your created courses.</p>
                    </div>
                    {activeTab === 'courses' && (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 sm:w-80">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search courses..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-black/30 backdrop-blur-md text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:border-[#D97757] focus:bg-white dark:focus:bg-slate-900/60 focus:outline-none transition-all shadow-sm focus:shadow-md dark:shadow-inner"
                                />
                            </div>
                            <button
                                onClick={() => navigate('/instructor/create')}
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-[0_4px_15px_rgba(124,58,237,0.35)] hover:shadow-[0_6px_20px_rgba(124,58,237,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap flex items-center gap-2 text-sm"
                            >
                                + New Course
                            </button>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 p-1 rounded-2xl backdrop-blur-sm mb-7 w-fit">
                    {[
                        { key: 'courses',     label: 'Courses',     icon: BookOpen },
                        { key: 'enrollments', label: 'Enrollments', icon: UserCheck },
                    ].map(({ key, label, icon }) => {
                        const Icon = icon;
                        return (
                            <button
                                key={key}
                                onClick={() => setTab(key)}
                                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                                    activeTab === key
                                        ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm'
                                        : 'text-slate-500 dark:text-white/50 hover:text-slate-700 dark:hover:text-white/80'
                                }`}
                            >
                                <Icon size={15} />
                                {label}
                            </button>
                        );
                    })}
                </div>

                {/* ── Courses Tab ── */}
                {activeTab === 'courses' && (
                    <>
                        {/* Stats bar */}
                        {!isLoading && (
                            <div className="flex items-center gap-3 mb-8">
                                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-sm font-bold">
                                    {courses.length} {courses.length === 1 ? 'Course' : 'Courses'} Total
                                </span>
                                {courses.filter(c => c.isPublished).length > 0 && (
                                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                                        {courses.filter(c => c.isPublished).length} Published
                                    </span>
                                )}
                                {courses.filter(c => c.generationStatus === 'generating').length > 0 && (
                                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-sm font-bold animate-pulse">
                                        {courses.filter(c => c.generationStatus === 'generating').length} Generating
                                    </span>
                                )}
                            </div>
                        )}

                        {isLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
                            </div>
                        ) : filteredCourses.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredCourses.map(course => {
                                    const deptStyle = getDeptStyle(course.department);
                                    return (
                                        <div
                                            key={course.id}
                                            className="bg-white/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-3xl hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-300 group flex flex-col h-full relative overflow-hidden"
                                            style={{ '--glow-color': deptStyle.glow }}
                                        >
                                            <div className="h-1 w-full bg-gradient-to-r from-[#D97757] to-[#7C3AED] rounded-t-3xl" />
                                            <div
                                                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none"
                                                style={{ background: `radial-gradient(circle at 75% 20%, ${deptStyle.glow} 0%, transparent 60%)` }}
                                            />

                                            {/* Header */}
                                            <div className="flex justify-between items-start mb-5 relative z-10 px-6 pt-5">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border text-3xl ${deptStyle.iconBg}`}>
                                                    {course.courseAvatar || '📚'}
                                                </div>
                                                <div className="flex flex-col items-end gap-1.5">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${deptStyle.bg}`}>
                                                        {course.department || 'General'}
                                                    </span>
                                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border shadow-inner ${
                                                        course.generationStatus === 'generating' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20 animate-pulse' :
                                                        course.generationStatus === 'failed'     ? 'bg-red-500/10     text-red-500     border-red-500/20'     :
                                                        course.isPublished                       ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                                                    }`}>
                                                        {course.generationStatus === 'generating' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />}
                                                        {course.generationStatus === 'generating' ? 'Generating' :
                                                         course.generationStatus === 'failed'     ? 'Failed'     :
                                                         course.isPublished                       ? 'Published'  : 'Draft'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="relative z-10 flex-1 flex flex-col px-6 pb-6">
                                                <h3 className="font-display font-bold text-xl text-slate-800 dark:text-white mb-1.5 line-clamp-2 drop-shadow-sm dark:drop-shadow-md group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                                    {course.title || 'Untitled Course'}
                                                </h3>
                                                <p className="text-slate-500 dark:text-white/55 text-sm mb-5 line-clamp-2 font-medium leading-relaxed">
                                                    {course.description || 'No description provided.'}
                                                </p>

                                                {/* Pills */}
                                                {(() => {
                                                    const levelKey = (course.level || 'beginner').toLowerCase();
                                                    const lvl = LEVEL_CONFIG[levelKey] || LEVEL_CONFIG.beginner;
                                                    const nodeCount = course.nodeCount ?? course.nodes?.length ?? 0;
                                                    return (
                                                        <div className="flex items-center gap-2 mb-5 flex-wrap">
                                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${lvl.bg} ${lvl.color}`}>
                                                                <span>{lvl.emoji}</span> {lvl.label}
                                                            </span>
                                                            {nodeCount > 0 && (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400">
                                                                    <Layers size={11} /> {nodeCount} lessons
                                                                </span>
                                                            )}
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400">
                                                                <Users size={11} /> {course.studentCount ?? 0}
                                                            </span>
                                                        </div>
                                                    );
                                                })()}

                                                {/* XP bar */}
                                                <div className="mb-5 bg-gradient-to-r from-purple-500/8 to-indigo-500/8 border border-purple-500/15 rounded-2xl px-4 py-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-sm">
                                                            <Zap size={14} className="text-white" />
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-600 dark:text-white/70">XP per lesson</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Star size={12} className="text-yellow-500 fill-yellow-500" />
                                                        <Star size={12} className="text-yellow-500 fill-yellow-500" />
                                                        <Star size={12} className="text-yellow-500 fill-yellow-500" />
                                                        <span className="ml-1.5 text-xs font-black text-purple-600 dark:text-purple-400">+50 XP</span>
                                                    </div>
                                                </div>

                                                {/* Footer actions */}
                                                <div className="mt-auto space-y-2">
                                                    {/* Enrollments quick-access */}
                                                    <button
                                                        onClick={() => openEnrollments(course.id)}
                                                        className="w-full h-9 rounded-xl border border-indigo-500/20 bg-indigo-500/8 hover:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                                                    >
                                                        <UserCheck size={14} /> View Enrollments
                                                    </button>

                                                    <div className="flex items-center justify-between gap-2">
                                                        <button
                                                            onClick={() => handleDelete(course.id, course.title)}
                                                            disabled={deletingId === course.id}
                                                            className="w-10 h-10 bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/20 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 shadow-inner flex-shrink-0"
                                                            title="Delete course"
                                                        >
                                                            {deletingId === course.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                        </button>
                                                        <button
                                                            onClick={() => navigate(`/instructor/course/${course.id}`)}
                                                            className="flex-1 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-[0_4px_14px_rgba(124,58,237,0.35)] hover:shadow-[0_6px_20px_rgba(124,58,237,0.5)] group-hover:scale-[1.02] active:scale-[0.97]"
                                                        >
                                                            Open Course <ArrowRight size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-24 bg-white/70 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 rounded-3xl relative z-10 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.01)] backdrop-blur-md">
                                <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 text-slate-400 dark:text-white/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                    <BookOpen size={40} className="text-purple-500 dark:text-purple-400" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white drop-shadow-sm dark:drop-shadow-md mb-3">No courses found</h3>
                                <p className="text-slate-500 dark:text-white/60 mb-8 max-w-md mx-auto text-lg font-medium leading-relaxed">
                                    {searchTerm ? 'Try adjusting your search filters.' : "You haven't created any courses yet."}
                                </p>
                                {!searchTerm && (
                                    <button
                                        onClick={() => navigate('/instructor/create')}
                                        className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3.5 rounded-xl font-bold shadow-[0_0_15px_rgba(124,58,237,0.4)] hover:shadow-[0_0_22px_rgba(124,58,237,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                                    >
                                        Create Your First Course
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* ── Enrollments Tab ── */}
                {activeTab === 'enrollments' && (
                    <EnrollmentTab courses={courses} preselectedCourseId={enrollmentCourseId} />
                )}
            </div>
        </InstructorLayout>
    );
};

export default ManagedCourses;
