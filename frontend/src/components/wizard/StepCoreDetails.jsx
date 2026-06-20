import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Code2, Calculator, Atom, Leaf, BookOpen, MoreHorizontal, Sparkles } from 'lucide-react';

const DEPARTMENTS = [
    { value: 'cs', label: 'Computer Science', icon: Code2, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', activeBg: 'bg-purple-600' },
    { value: 'math', label: 'Mathematics', icon: Calculator, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', activeBg: 'bg-blue-600' },
    { value: 'physics', label: 'Physics', icon: Atom, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200', activeBg: 'bg-cyan-600' },
    { value: 'bio', label: 'Biology', icon: Leaf, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', activeBg: 'bg-emerald-600' },
    { value: 'literature', label: 'Literature', icon: BookOpen, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', activeBg: 'bg-rose-600' },
    { value: 'other', label: 'Other', icon: MoreHorizontal, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', activeBg: 'bg-gray-600' },
];

const StepCoreDetails = () => {
    const { register, setValue, watch, formState: { errors } } = useFormContext();
    const title = watch('title') || '';
    const description = watch('description') || '';
    const department = watch('department') || '';

    const selectedDept = DEPARTMENTS.find(d => d.value === department);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-2xl font-display font-bold text-gray-900">Course Details</h3>
                    <p className="text-gray-500 mt-1">Set the foundation for your new course.</p>
                </div>
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-full text-xs font-bold shrink-0">
                    <Sparkles size={12} />
                    +50 XP
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left: Form */}
                <div className="lg:col-span-3 space-y-5">
                    {/* Course Name */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Course Name</label>
                        <input
                            {...register('title', { required: 'Course Name is required' })}
                            className={`w-full px-4 py-3 rounded-xl border-2 font-medium transition-all duration-200 outline-none
                                ${errors.title
                                    ? 'border-red-400 bg-red-50 focus:border-red-500'
                                    : 'border-gray-200 bg-white focus:border-studylabs-orange focus:shadow-[0_0_0_3px_rgba(217,119,87,0.12)]'
                                }`}
                            placeholder="e.g. Advanced Data Structures"
                        />
                        {errors.title && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.title.message}</p>}
                    </div>

                    {/* Department Grid */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Academic Department</label>
                        <input type="hidden" {...register('department', { required: 'Please select a department' })} />
                        <div className="grid grid-cols-3 gap-2">
                            {DEPARTMENTS.map((dept) => {
                                const Icon = dept.icon;
                                const isSelected = department === dept.value;
                                return (
                                    <button
                                        key={dept.value}
                                        type="button"
                                        onClick={() => setValue('department', dept.value, { shouldValidate: true })}
                                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer
                                            ${isSelected
                                                ? `border-transparent ${dept.bg} shadow-md scale-[1.02]`
                                                : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className={`p-1.5 rounded-lg transition-colors ${isSelected ? dept.bg : 'bg-gray-100'}`}>
                                            <Icon size={18} className={isSelected ? dept.color : 'text-gray-400'} />
                                        </div>
                                        <span className={`text-[11px] font-bold leading-tight text-center ${isSelected ? dept.color : 'text-gray-500'}`}>
                                            {dept.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        {errors.department && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.department.message}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-sm font-bold text-gray-700">Description</label>
                            <span className={`text-xs font-medium ${description.length >= 10 ? 'text-emerald-600' : 'text-gray-400'}`}>
                                {description.length}/200
                            </span>
                        </div>
                        <textarea
                            {...register('description', {
                                required: 'Description is required',
                                minLength: { value: 10, message: 'Must be at least 10 characters' }
                            })}
                            maxLength={200}
                            className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 outline-none h-28 resize-none
                                ${errors.description
                                    ? 'border-red-400 bg-red-50 focus:border-red-500'
                                    : 'border-gray-200 bg-white focus:border-studylabs-orange focus:shadow-[0_0_0_3px_rgba(217,119,87,0.12)]'
                                }`}
                            placeholder="Briefly describe what students will learn in this course..."
                        />
                        {errors.description && <p className="text-red-500 text-xs mt-1 font-medium">{errors.description.message}</p>}
                    </div>
                </div>

                {/* Right: Live Preview Card */}
                <div className="lg:col-span-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Live Preview</p>
                    <div className="glass-card rounded-2xl p-4 h-full min-h-[220px] flex flex-col">
                        {/* Department badge */}
                        {selectedDept ? (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold w-fit mb-3 ${selectedDept.bg} ${selectedDept.color}`}>
                                <selectedDept.icon size={11} />
                                {selectedDept.label}
                            </span>
                        ) : (
                            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-400 w-fit mb-3">
                                No department
                            </span>
                        )}

                        {/* Title */}
                        <h4 className={`font-display font-bold leading-tight mb-2 ${title ? 'text-gray-900 text-base' : 'text-gray-300 text-sm italic'}`}>
                            {title || 'Your course title will appear here...'}
                        </h4>

                        {/* Description */}
                        <p className={`text-xs leading-relaxed flex-1 ${description ? 'text-gray-600' : 'text-gray-300 italic'}`}>
                            {description || 'Your course description will appear here...'}
                        </p>

                        {/* Footer */}
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-studylabs-orange to-studylabs-purple flex items-center justify-center text-white text-[10px] font-bold">
                                {title ? title[0].toUpperCase() : '?'}
                            </div>
                            <span className="text-xs text-gray-400">Your Course</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StepCoreDetails;
