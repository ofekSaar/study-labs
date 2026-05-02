import React from 'react';
import { useFormContext } from 'react-hook-form';

const StepCoreDetails = () => {
    const { register, formState: { errors } } = useFormContext();

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Core Details</h3>
                <p className="text-gray-500 mb-6">Let's start with the basics of your new course.</p>

                <div className="space-y-4">
                    {/* Course Name */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Course Name</label>
                        <input
                            {...register('courseName', { required: 'Course Name is required' })}
                            className={`w-full p-3 rounded-xl border-2 ${errors.courseName ? 'border-red-500' : 'border-gray-200'} focus:border-studylabs-blue focus:outline-none transition`}
                            placeholder="e.g. Advanced Data Structures"
                        />
                        {errors.courseName && <p className="text-red-500 text-xs mt-1">{errors.courseName.message}</p>}
                    </div>

                    {/* Department */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Academic Department</label>
                        <select
                            {...register('department', { required: 'Department is required' })}
                            className={`w-full p-3 rounded-xl border-2 ${errors.department ? 'border-red-500' : 'border-gray-200'} focus:border-studylabs-blue focus:outline-none transition bg-white`}
                        >
                            <option value="">Select Department</option>
                            <option value="cs">Computer Science</option>
                            <option value="math">Mathematics</option>
                            <option value="physics">Physics</option>
                            <option value="bio">Biology</option>
                            <option value="other">Other</option>
                        </select>
                        {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department.message}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                        <textarea
                            {...register('description', { required: 'Description is required', minLength: { value: 10, message: 'Must be at least 10 characters' } })}
                            className={`w-full p-3 rounded-xl border-2 ${errors.description ? 'border-red-500' : 'border-gray-200'} focus:border-studylabs-blue focus:outline-none transition h-32 resize-none`}
                            placeholder="Briefly describe what students will learn..."
                        />
                        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StepCoreDetails;
