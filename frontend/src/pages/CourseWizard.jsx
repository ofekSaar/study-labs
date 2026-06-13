import React, { useState, useEffect } from 'react';
import InstructorLayout from '../components/layout/InstructorLayout';
import { useForm, FormProvider } from 'react-hook-form';
import { ChevronRight, ChevronLeft, Check, Loader2, FileText, UploadCloud, Brain, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

// Steps
import StepCoreDetails from '../components/wizard/StepCoreDetails';
import StepMaterials from '../components/wizard/StepMaterials';
import StepAIConfig from '../components/wizard/StepAIConfig';
import StepGamification from '../components/wizard/StepGamification';

const steps = [
    { title: 'Details', component: StepCoreDetails, icon: FileText },
    { title: 'Materials', component: StepMaterials, icon: UploadCloud },
    { title: 'AI Config', component: StepAIConfig, icon: Brain },
    { title: 'Gamification', component: StepGamification, icon: Trophy }
];

const CourseWizard = () => {
    const methods = useForm({
        defaultValues: {
            nodeCount: 10,
            quizFrequency: 3,
            xpMultiplier: 1.0,
            leaderboardEnabled: true,
            syllabus: [],
            materials: []
        }
    });
    const [currentStep, setCurrentStep] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [createdCourseId, setCreatedCourseId] = useState(null);
    const [generationProgress, setGenerationProgress] = useState('Initializing AI Engine...');
    const navigate = useNavigate();

    const StepComponent = steps[currentStep].component;

    const handleNext = async () => {
        let fieldsToValidate = [];
        if (currentStep === 0) {
            fieldsToValidate = ['title', 'department', 'description'];
        } else if (currentStep === 1) {
            fieldsToValidate = ['syllabus', 'materials'];
        } else if (currentStep === 2) {
            fieldsToValidate = ['nodeCount', 'quizFrequency'];
        }

        const isValid = await methods.trigger(fieldsToValidate);
        
        if (isValid) {
            setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
    };

    const onSubmit = async (data) => {
        setIsProcessing(true);

        try {
            const formData = new FormData();
            formData.append('title', data.title);
            formData.append('department', data.department || 'other');
            formData.append('description', data.description || '');
            formData.append('aiConfig', JSON.stringify({
                nodeCount: data.nodeCount,
                quizFrequency: data.quizFrequency
            }));
            formData.append('gamification', JSON.stringify({
                xpMultiplier: data.xpMultiplier,
                leaderboardEnabled: data.leaderboardEnabled
            }));

            // Append syllabus
            if (data.syllabus && data.syllabus.length > 0) {
                formData.append('syllabus', data.syllabus[0]);
            }

            // Append course materials
            if (data.materials && data.materials.length > 0) {
                Array.from(data.materials).forEach(file => {
                    formData.append('materials', file);
                });
            }

            // Append image analysis preference
            formData.append('analyzeImages', data.analyzeImages ? 'true' : 'false');

            const res = await api.upload('/api/courses', formData);
            
            setIsProcessing(false);
            if (res.data && res.data.course && res.data.course._id) {
                setCreatedCourseId(res.data.course._id);
            }
            setIsSuccess(true);
        } catch (error) {
            alert(error.message || "Failed to create course");
            setIsProcessing(false);
        }
    };

    // Polling effect for generation progress
    useEffect(() => {
        let interval;
        if (isSuccess && createdCourseId) {
            interval = setInterval(async () => {
                try {
                    const res = await api.get(`/api/courses/${createdCourseId}`);
                    const course = res.data.course;
                    
                    if (course.generationProgress) {
                        setGenerationProgress(course.generationProgress);
                    }
                    
                    if (course.generationStatus === 'ready') {
                        clearInterval(interval);
                        navigate('/instructor');
                    } else if (course.generationStatus === 'failed') {
                        clearInterval(interval);
                        alert("AI generation failed. Please try again.");
                        navigate('/instructor');
                    }
                } catch (err) {
                    console.error("Failed to poll course status:", err);
                }
            }, 2000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isSuccess, createdCourseId, navigate]);

    if (isSuccess) {
        return (
            <InstructorLayout title="Create Course">
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
                    <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                        <Check size={48} />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-display font-bold text-gray-900 mb-2">Generating Course!</h2>
                    <p className="text-gray-500 max-w-md mb-4">
                        Our AI is now processing your materials and generating the learning map. This usually takes about 2-3 minutes.
                    </p>
                    <div className="w-full max-w-md bg-white p-3 sm:p-4 rounded-xl border border-blue-100 shadow-sm flex items-center gap-3 sm:gap-4 mb-8 text-left">
                        <Loader2 size={24} className="text-studylabs-blue animate-spin shrink-0" />
                        <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Current Status</p>
                            <p className="text-sm font-medium text-studylabs-blue truncate animate-pulse">
                                {generationProgress}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/instructor')}
                        className="bg-gray-100 text-gray-600 px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition"
                    >
                        Run in Background
                    </button>
                </div>
            </InstructorLayout>
        );
    }

    if (isProcessing) {
        return (
            <InstructorLayout title="Create Course">
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
                    <Loader2 size={64} className="text-studylabs-blue animate-spin mb-6" />
                    <h2 className="text-2xl font-bold text-gray-900">Processing Course...</h2>
                    <p className="text-gray-500 mt-2">Uploading materials and configuring AI engine.</p>
                </div>
            </InstructorLayout>
        );
    }

    return (
        <InstructorLayout title="New Course Wizard">
            <div className="max-w-3xl mx-auto py-6 sm:py-10 md:py-12 px-4 sm:px-6 md:px-0 pb-40">
                {/* Glowing Connected Timeline Stepper */}
                <div className="mb-8 sm:mb-12 relative px-2 sm:px-4">
                    {/* Background track line */}
                    <div className="absolute top-5 left-8 right-8 h-1 bg-slate-100 dark:bg-white/5 -translate-y-1/2 z-0 rounded-full" />
                    
                    {/* Glowing progress line */}
                    <div 
                        className="absolute top-5 left-8 h-1 bg-gradient-to-r from-purple-600 to-indigo-600 -translate-y-1/2 z-0 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(124,58,237,0.4)]"
                        style={{ width: currentStep === 0 ? '0px' : `calc(${((currentStep) / (steps.length - 1)) * 100}% - 16px)` }}
                    />

                    <div className="flex items-center justify-between relative z-10">
                        {steps.map((step, idx) => {
                            const isCompleted = idx < currentStep;
                            const isActive = idx === currentStep;
                            const Icon = step.icon;

                            return (
                                <div key={idx} className="flex flex-col items-center group">
                                    {/* Circle wrapper */}
                                    <div 
                                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold border-2 transition-all duration-300 relative ${
                                            isCompleted 
                                                ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 border-transparent text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' 
                                                : isActive 
                                                    ? 'bg-white dark:bg-slate-900 border-purple-500 text-purple-600 dark:text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.2)] scale-110' 
                                                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/20'
                                        }`}
                                    >
                                        {isCompleted ? (
                                            <Check size={18} className="stroke-[3]" />
                                        ) : (
                                            <Icon size={18} />
                                        )}
                                        
                                        {/* Pulse glow for active step */}
                                        {isActive && (
                                            <span className="absolute -inset-1 rounded-2xl border border-purple-500/50 animate-pulse pointer-events-none" />
                                        )}
                                    </div>
                                    
                                    {/* Label */}
                                    <span className={`text-[11px] font-black uppercase tracking-wider mt-3 transition-colors ${
                                        isActive 
                                            ? 'text-purple-600 dark:text-purple-400' 
                                            : isCompleted 
                                                ? 'text-indigo-600/80 dark:text-indigo-400/80' 
                                                : 'text-slate-400 dark:text-white/30'
                                    }`}>
                                        {step.title}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Form Content */}
                <FormProvider {...methods}>
                    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-3xl border border-gray-100 shadow-xl min-h-[500px] flex flex-col justify-between">

                        <StepComponent />

                        {/* Actions */}
                        <div className="flex justify-between mt-10 pt-6 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={handleBack}
                                disabled={currentStep === 0}
                                className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                <ChevronLeft size={20} />
                                Back
                            </button>

                            {currentStep === steps.length - 1 ? (
                                <button
                                    type="button"
                                    onClick={methods.handleSubmit(onSubmit)}
                                    className="bg-studylabs-blue text-white px-8 py-3 rounded-xl font-bold hover:bg-studylabs-dark transition flex items-center gap-2 shadow-lg shadow-blue-200"
                                >
                                    Create Course
                                    <Check size={20} />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition flex items-center gap-2"
                                >
                                    Next Step
                                    <ChevronRight size={20} />
                                </button>
                            )}
                        </div>
                    </div>
                </FormProvider>
            </div>
        </InstructorLayout>
    );
};

export default CourseWizard;
