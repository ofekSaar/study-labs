import React from 'react';
import { ChevronRight } from 'lucide-react';

const CourseCard = ({ title, professor, icon, progress, color = 'bg-studylabs-blue' }) => {
    return (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer">
            <div
                className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-white`}
            >
                {icon}
            </div>

            <div>
                <h3 className="font-bold text-gray-900 leading-tight">{title}</h3>
                <p className="text-xs text-gray-500 mt-1">{professor}</p>
            </div>

            <div className="mt-auto pt-2">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color}`} style={{ width: `${progress}%` }} />
                </div>
            </div>
        </div>
    );
};

export default CourseCard;
