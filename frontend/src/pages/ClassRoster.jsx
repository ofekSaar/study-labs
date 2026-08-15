import React, { useEffect, useState, useMemo } from 'react';
import {
    Users,
    Zap,
    Flame,
    CheckSquare,
    Square,
    Mail,
    SlidersHorizontal,
    TrendingUp,
    AlertTriangle,
    Clock,
    UserPlus,
    X,
} from 'lucide-react';
import useCourseStore from '../store/courseStore';
import useEnrollmentStore from '../store/enrollmentStore';
import useToastStore from '../store/toastStore';
import api from '../utils/api';
import { clickableProps } from '../utils/a11y';
import Spinner from '../components/common/Spinner';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import logger from '../utils/logger';

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const daysSince = (date) => (date ? Math.floor((Date.now() - new Date(date)) / MS_PER_DAY) : null);

const ClassRoster = () => {
    const { courses, fetchAllCourses } = useCourseStore();
    const { addStudentToCourse } = useEnrollmentStore();
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [threshold, setThreshold] = useState(70);
    const [thresholdInput, setThresholdInput] = useState('70');
    const [selected, setSelected] = useState(new Set());
    const [showAddModal, setShowAddModal] = useState(false);
    const [addEmail, setAddEmail] = useState('');
    const [addError, setAddError] = useState('');
    const [addSuccess, setAddSuccess] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (!addEmail.trim() || addEmail.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            try {
                const { data } = await api.get(`/api/enrollments/search-students?query=${encodeURIComponent(addEmail)}`);
                setSearchResults(data.students || []);
            } catch (err) {
                logger.error('Failed to search students', err);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [addEmail]);

    useEffect(() => {
        fetchAllCourses();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (courses.length > 0 && !selectedCourseId) {
            setSelectedCourseId(courses[0].id);
        }
    }, [courses, selectedCourseId]);

    const loadStudents = async (courseId) => {
        const { data } = await api.get(`/api/courses/${courseId}/students`);
        setStudents(data.students || []);
    };

    useEffect(() => {
        const fetchStudents = async () => {
            if (!selectedCourseId) return;
            setSelected(new Set());
            setIsLoading(true);
            try {
                await loadStudents(selectedCourseId);
            } catch (err) {
                logger.error('Failed to fetch students', err);
                useToastStore
                    .getState()
                    .error(
                        'Failed to load roster',
                        'Could not fetch students for this course. Please try again.'
                    );
            } finally {
                setIsLoading(false);
            }
        };
        fetchStudents();
    }, [selectedCourseId]);

    const aboveThreshold = useMemo(
        () => students.filter((s) => s.completion >= threshold),
        [students, threshold]
    );
    const belowThreshold = useMemo(
        () => students.filter((s) => s.completion < threshold),
        [students, threshold]
    );

    const toggleSelect = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (selected.size === students.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(students.map((s) => s.student._id)));
        }
    };

    const handleSendMessage = () => {
        const selectedEmails = Array.from(selected)
            .map((id) => students.find((s) => s.student._id === id)?.student?.email)
            .filter(Boolean);
        if (selectedEmails.length > 0) {
            window.open(`mailto:${selectedEmails.join(',')}`);
        }
    };

    const handleThresholdInput = (val) => {
        setThresholdInput(val);
        const num = parseInt(val);
        if (!isNaN(num) && num >= 0 && num <= 100) setThreshold(num);
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        if (!selectedCourseId || !addEmail.trim()) return;
        setIsAdding(true);
        setAddError('');
        setAddSuccess('');
        try {
            const enrollment = await addStudentToCourse(selectedCourseId, addEmail.trim());
            setAddSuccess(`${enrollment.student?.name || addEmail} was added successfully.`);
            setAddEmail('');
            await loadStudents(selectedCourseId);
        } catch (err) {
            setAddError(err.message || 'Failed to add student');
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 dot-grid opacity-60" />
                <div
                    className="absolute top-0 right-0 w-96 h-96 rounded-full"
                    style={{
                        background:
                            'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
                        filter: 'blur(40px)',
                    }}
                />
                <div
                    className="absolute bottom-0 left-0 w-96 h-96 rounded-full"
                    style={{
                        background:
                            'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
                        filter: 'blur(40px)',
                    }}
                />
            </div>

            <div className="relative z-[1] space-y-6 p-4 sm:p-6 md:p-8 pb-32 max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-black text-slate-800 dark:text-white drop-shadow-sm dark:drop-shadow-md tracking-tight">
                            Class Roster
                        </h1>
                        <p className="text-slate-500 dark:text-white/60 text-lg mt-1 font-medium">
                            View all enrolled students and set a progress threshold.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {/* Course selector */}
                        <select
                            value={selectedCourseId}
                            onChange={(e) => setSelectedCourseId(e.target.value)}
                            className="flex-1 md:min-w-[220px] bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl pl-4 pr-8 py-2.5 text-sm font-bold text-slate-700 dark:text-white shadow-inner focus:outline-none focus:border-purple-500 appearance-none cursor-pointer"
                            style={{
                                backgroundImage:
                                    "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238B5CF6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'/%3e%3c/svg%3e\")",
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 0.75rem center',
                                backgroundSize: '1em',
                            }}
                        >
                            {courses.map((c) => (
                                <option
                                    key={c.id}
                                    value={c.id}
                                    className="bg-white dark:bg-slate-900"
                                >
                                    {c.title}
                                </option>
                            ))}
                        </select>

                        {/* Add Student button */}
                        <Button
                            variant="purple"
                            icon={UserPlus}
                            disabled={!selectedCourseId}
                            className="flex-shrink-0"
                            onClick={() => {
                                setShowAddModal(true);
                                setAddError('');
                                setAddSuccess('');
                                setAddEmail('');
                            }}
                        >
                            <span className="hidden sm:inline">Add Student</span>
                        </Button>
                    </div>
                </div>

                {/* Threshold Control */}
                <div className="bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <SlidersHorizontal
                                size={18}
                                className="text-purple-600 dark:text-purple-400"
                            />
                            <span className="font-bold text-sm text-slate-700 dark:text-white">
                                Progress Threshold
                            </span>
                        </div>
                        <div className="flex items-center gap-3 flex-1">
                            <input
                                type="range"
                                min={0}
                                max={100}
                                value={threshold}
                                onChange={(e) => {
                                    setThreshold(Number(e.target.value));
                                    setThresholdInput(e.target.value);
                                }}
                                className="flex-1 accent-purple-600 cursor-pointer"
                            />
                            <input
                                type="number"
                                min={0}
                                max={100}
                                value={thresholdInput}
                                onChange={(e) => handleThresholdInput(e.target.value)}
                                className="w-16 text-center font-black text-slate-800 dark:text-white bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl px-2 py-1.5 text-sm focus:outline-none focus:border-purple-500"
                            />
                            <span className="text-sm font-bold text-slate-500 dark:text-white/50">
                                %
                            </span>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                <span className="text-xs font-bold text-slate-600 dark:text-white/60">
                                    ≥ {threshold}%
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-rose-500" />
                                <span className="text-xs font-bold text-slate-600 dark:text-white/60">
                                    &lt; {threshold}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        label="Total Enrolled"
                        value={students.length}
                        icon={<Users size={22} className="text-indigo-500 dark:text-indigo-400" />}
                        color="indigo"
                    />
                    <StatCard
                        label="Above Threshold"
                        value={`${aboveThreshold.length} (${students.length ? Math.round((aboveThreshold.length / students.length) * 100) : 0}%)`}
                        icon={
                            <TrendingUp
                                size={22}
                                className="text-emerald-500 dark:text-emerald-400"
                            />
                        }
                        color="emerald"
                    />
                    <StatCard
                        label="Below Threshold"
                        value={`${belowThreshold.length} (${students.length ? Math.round((belowThreshold.length / students.length) * 100) : 0}%)`}
                        icon={
                            <AlertTriangle size={22} className="text-rose-500 dark:text-rose-400" />
                        }
                        color="rose"
                    />
                    <StatCard
                        label="Avg. Completion"
                        value={`${students.length ? Math.round(students.reduce((s, x) => s + x.completion, 0) / students.length) : 0}%`}
                        icon={
                            <TrendingUp
                                size={22}
                                className="text-purple-500 dark:text-purple-400"
                            />
                        }
                        color="purple"
                    />
                </div>

                {/* Bulk Action Bar */}
                {selected.size > 0 && (
                    <div className="flex items-center justify-between bg-purple-600 text-white rounded-2xl px-5 py-3 shadow-[0_4px_20px_rgba(124,58,237,0.4)]">
                        <span className="font-bold text-sm">
                            {selected.size} student{selected.size > 1 ? 's' : ''} selected
                        </span>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleSendMessage}
                                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 border border-white/30 px-4 py-2 rounded-xl text-sm font-bold transition-colors"
                            >
                                <Mail size={15} />
                                Send Message
                            </button>
                            <button
                                onClick={() => setSelected(new Set())}
                                className="text-white/70 hover:text-white text-sm font-medium transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                )}

                {/* Student Grid */}
                {isLoading ? (
                    <Spinner center color="purple" label="Loading roster" />
                ) : students.length === 0 ? (
                    <EmptyState
                        icon={Users}
                        title="No enrolled students yet"
                        description="Students will appear here once they enroll in this course."
                    />
                ) : (
                    <>
                        {/* Select All */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleAll}
                                className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-white/50 hover:text-slate-800 dark:hover:text-white transition-colors"
                            >
                                {selected.size === students.length ? (
                                    <CheckSquare
                                        size={16}
                                        className="text-purple-600 dark:text-purple-400"
                                    />
                                ) : (
                                    <Square size={16} />
                                )}
                                {selected.size === students.length ? 'Deselect all' : 'Select all'}
                            </button>
                            <span className="text-xs text-slate-400 dark:text-white/30 font-medium">
                                · {students.length} students
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {students.map((item) => {
                                const {
                                    student,
                                    completion,
                                    totalXP,
                                    streak,
                                    lastActivityDate,
                                    completedNodes,
                                    totalNodes,
                                } = item;
                                const isAbove = completion >= threshold;
                                const isChecked = selected.has(student._id);
                                const inactive = daysSince(lastActivityDate);

                                return (
                                    <div
                                        key={student._id}
                                        {...clickableProps(
                                            () => toggleSelect(student._id),
                                            `Select ${student.name || 'student'}`
                                        )}
                                        aria-pressed={isChecked}
                                        className={`relative bg-white dark:bg-white/5 border-2 rounded-3xl p-5 cursor-pointer transition-all duration-200 hover:shadow-lg group ${
                                            isChecked
                                                ? 'border-purple-500 shadow-[0_0_0_3px_rgba(124,58,237,0.15)]'
                                                : isAbove
                                                  ? 'border-emerald-400/60 dark:border-emerald-500/40 hover:border-emerald-500 dark:hover:border-emerald-400'
                                                  : 'border-rose-400/60 dark:border-rose-500/40 hover:border-rose-500 dark:hover:border-rose-400'
                                        }`}
                                    >
                                        {/* Status dot + checkbox */}
                                        <div className="absolute top-4 right-4 flex items-center gap-2">
                                            <div
                                                className={`w-2.5 h-2.5 rounded-full ${isAbove ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                            />
                                            <div
                                                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                                                    isChecked
                                                        ? 'bg-purple-600 border-purple-600'
                                                        : 'border-slate-300 dark:border-white/20'
                                                }`}
                                            >
                                                {isChecked && (
                                                    <svg
                                                        className="w-3 h-3 text-white"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                        strokeWidth={3}
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M5 13l4 4L19 7"
                                                        />
                                                    </svg>
                                                )}
                                            </div>
                                        </div>

                                        {/* Avatar + Info */}
                                        <div className="flex items-center gap-3 mb-4">
                                            {student.avatar &&
                                            (student.avatar.startsWith('http') ||
                                                student.avatar.startsWith('/')) ? (
                                                <img
                                                    src={student.avatar}
                                                    alt={
                                                        student.name
                                                            ? `${student.name}'s avatar`
                                                            : 'Student avatar'
                                                    }
                                                    className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-white/10 flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/5 flex items-center justify-center text-2xl flex-shrink-0 select-none">
                                                    {student.avatar || '🎓'}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-800 dark:text-white truncate leading-tight">
                                                    {student.name}
                                                </p>
                                                <p className="text-xs text-slate-400 dark:text-white/40 truncate">
                                                    {student.email}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mb-3">
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className="text-xs font-bold text-slate-500 dark:text-white/50">
                                                    Progress
                                                </span>
                                                <span
                                                    className={`text-sm font-black ${isAbove ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
                                                >
                                                    {completion}%
                                                </span>
                                            </div>
                                            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                        isAbove
                                                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                                            : 'bg-gradient-to-r from-rose-500 to-pink-400'
                                                    }`}
                                                    style={{ width: `${completion}%` }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-slate-400 dark:text-white/30 mt-1 font-medium">
                                                {completedNodes} / {totalNodes} nodes
                                            </p>
                                        </div>

                                        {/* Badges */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-[11px] font-bold">
                                                <Zap size={11} />
                                                {totalXP} XP
                                            </span>
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-[11px] font-bold">
                                                <Flame size={11} />
                                                {streak}d streak
                                            </span>
                                            {inactive === null ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/40 text-[11px] font-bold">
                                                    <Clock size={11} />
                                                    Never started
                                                </span>
                                            ) : (
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                                                        inactive === 0
                                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                                            : inactive <= 7
                                                              ? 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/50'
                                                              : 'bg-rose-500/10 border-rose-500/20 text-rose-500 dark:text-rose-400'
                                                    }`}
                                                >
                                                    <Clock size={11} />
                                                    {inactive === 0
                                                        ? 'Active today'
                                                        : `${inactive}d ago`}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Add Student Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowAddModal(false)}
                        aria-hidden="true"
                    />
                    <div className="relative bg-white dark:bg-[#1a1625] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 w-full max-w-md p-6 z-10">
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-2xl flex items-center justify-center"
                                    style={{
                                        background:
                                            'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(217,119,87,0.1))',
                                    }}
                                >
                                    <UserPlus
                                        size={18}
                                        className="text-purple-600 dark:text-purple-400"
                                    />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-slate-800 dark:text-white leading-tight">
                                        Add Student
                                    </h2>
                                    <p className="text-[11px] text-slate-400 dark:text-white/40 font-medium">
                                        {courses.find((c) => c.id === selectedCourseId)?.title}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 dark:text-white/40 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleAddStudent} className="space-y-4">
                            <div>
                                <label
                                    htmlFor="add-student-email"
                                    className="block text-xs font-black text-slate-500 dark:text-white/50 uppercase tracking-wider mb-2"
                                >
                                    Student Email or Name Search
                                </label>
                                <div className="relative">
                                    <input
                                        id="add-student-email"
                                        type="text"
                                        value={addEmail}
                                        onChange={(e) => {
                                            setAddEmail(e.target.value);
                                            setAddError('');
                                            setAddSuccess('');
                                        }}
                                        placeholder="Type name or email to search..."
                                        required
                                        autoComplete="off"
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/25 text-sm font-medium focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                                    />
                                    {isSearching && (
                                        <div className="absolute right-3 top-3.5 flex items-center justify-center">
                                            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                    {searchResults.length > 0 && (
                                        <div className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto bg-white dark:bg-[#252033] border border-slate-200 dark:border-white/10 rounded-xl shadow-lg divide-y divide-slate-100 dark:divide-white/5">
                                            {searchResults.map((user) => (
                                                <div
                                                    key={user._id}
                                                    onClick={() => {
                                                        setAddEmail(user.email);
                                                        setSearchResults([]);
                                                    }}
                                                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center text-lg flex-shrink-0 select-none">
                                                        {user.avatar || '🎓'}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                                                            {user.name}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 dark:text-white/40 truncate">
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {addError && (
                                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium">
                                    <X size={14} className="flex-shrink-0" />
                                    {addError}
                                </div>
                            )}
                            {addSuccess && (
                                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                                    <svg
                                        className="w-4 h-4 flex-shrink-0"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2.5}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                    {addSuccess}
                                </div>
                            )}

                            <div className="flex gap-3 pt-1">
                                <Button
                                    variant="ghost"
                                    className="flex-1"
                                    onClick={() => setShowAddModal(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="purple"
                                    icon={UserPlus}
                                    loading={isAdding}
                                    disabled={!addEmail.trim()}
                                    className="flex-1"
                                >
                                    Add Student
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

const StatCard = ({ label, value, icon, color }) => {
    const colorMap = {
        indigo: 'bg-indigo-500/10 border-indigo-500/20 dark:bg-indigo-500/10 dark:border-indigo-500/20',
        emerald:
            'bg-emerald-500/10 border-emerald-500/20 dark:bg-emerald-500/10 dark:border-emerald-500/20',
        rose: 'bg-rose-500/10 border-rose-500/20 dark:bg-rose-500/10 dark:border-rose-500/20',
        purple: 'bg-purple-500/10 border-purple-500/20 dark:bg-purple-500/10 dark:border-purple-500/20',
    };
    return (
        <div className="p-5 rounded-3xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col gap-3">
            <div
                className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${colorMap[color]}`}
            >
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest mb-0.5">
                    {label}
                </p>
                <p className="text-xl font-black text-slate-800 dark:text-white">{value}</p>
            </div>
        </div>
    );
};

export default ClassRoster;
