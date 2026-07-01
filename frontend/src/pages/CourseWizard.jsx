import React, { useState, useEffect } from 'react';
import InstructorLayout from '../components/layout/InstructorLayout';
import { useForm, FormProvider } from 'react-hook-form';
import { ChevronRight, ChevronLeft, Check, Loader2, FileText, UploadCloud, Brain, Trophy, Sparkles, MapPin, CheckCircle2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import useToastStore from '../store/toastStore';

import StepCoreDetails from '../components/wizard/StepCoreDetails';
import StepMaterials from '../components/wizard/StepMaterials';
import StepAIConfig from '../components/wizard/StepAIConfig';
import StepGamification from '../components/wizard/StepGamification';

const steps = [
    { title: 'Details', component: StepCoreDetails, icon: FileText, xp: 50 },
    { title: 'Materials', component: StepMaterials, icon: UploadCloud, xp: 50 },
    { title: 'AI Config', component: StepAIConfig, icon: Brain, xp: 50 },
    { title: 'Launch', component: StepGamification, icon: Trophy, xp: 50 },
];

const PROCESSING_STEPS = [
    { label: 'Uploading materials', icon: UploadCloud },
    { label: 'Parsing syllabus with AI', icon: Brain },
    { label: 'Generating learning path', icon: MapPin },
    { label: 'Publishing course', icon: CheckCircle2 },
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
    const [processingStep, setProcessingStep] = useState(0);
    const [isSuccess, setIsSuccess] = useState(false);
    const [createdCourseId, setCreatedCourseId] = useState(null);
    const [generationProgress, setGenerationProgress] = useState('Initializing AI Engine...');
    const [courseSnapshot, setCourseSnapshot] = useState(null);
    const navigate = useNavigate();

    const StepComponent = steps[currentStep].component;
    const totalXP = steps.length * 50;

    const handleNext = async () => {
        let fieldsToValidate = [];
        if (currentStep === 0) fieldsToValidate = ['title', 'department', 'description'];
        else if (currentStep === 1) fieldsToValidate = ['syllabus', 'materials'];
        else if (currentStep === 2) fieldsToValidate = ['nodeCount', 'quizFrequency'];

        const isValid = await methods.trigger(fieldsToValidate);
        if (isValid) setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    };

    const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 0));

    const onSubmit = async (data) => {
        setIsProcessing(true);
        setCourseSnapshot(data);

        // Animate processing steps
        const stepInterval = setInterval(() => {
            setProcessingStep(prev => {
                if (prev < PROCESSING_STEPS.length - 1) return prev + 1;
                clearInterval(stepInterval);
                return prev;
            });
        }, 1200);

        try {
            const formData = new FormData();
            formData.append('title', data.title);
            formData.append('department', data.department || 'other');
            formData.append('description', data.description || '');
            formData.append('aiConfig', JSON.stringify({ nodeCount: data.nodeCount, quizFrequency: data.quizFrequency }));
            formData.append('gamification', JSON.stringify({ xpMultiplier: data.xpMultiplier, leaderboardEnabled: data.leaderboardEnabled }));
            if (data.syllabus && data.syllabus.length > 0) formData.append('syllabus', data.syllabus[0]);
            if (data.materials && data.materials.length > 0) {
                Array.from(data.materials).forEach(file => formData.append('materials', file));
            }
            formData.append('analyzeImages', data.analyzeImages ? 'true' : 'false');

            const res = await api.upload('/api/courses', formData);
            clearInterval(stepInterval);
            setIsProcessing(false);
            if (res.data && res.data.course && res.data.course._id) {
                setCreatedCourseId(res.data.course._id);
            }
            setIsSuccess(true);
        } catch (error) {
            clearInterval(stepInterval);
            useToastStore.getState().error('Course creation failed', error.message || 'Failed to create course. Please try again.');
            setIsProcessing(false);
        }
    };

    useEffect(() => {
        let interval;
        if (isSuccess && createdCourseId) {
            interval = setInterval(async () => {
                try {
                    const res = await api.get(`/api/courses/${createdCourseId}`);
                    const course = res.data.course;
                    if (course.generationProgress) setGenerationProgress(course.generationProgress);
                    if (course.generationStatus === 'ready') {
                        clearInterval(interval);
                        navigate('/instructor');
                    } else if (course.generationStatus === 'failed') {
                        clearInterval(interval);
                        useToastStore.getState().error('Generation failed', 'AI course generation failed. Please try again.');
                        navigate('/instructor');
                    }
                } catch (err) {
                    console.error('Failed to poll course status:', err);
                }
            }, 2000);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [isSuccess, createdCourseId, navigate]);

    if (isProcessing) {
        return (
            <InstructorLayout title="Create Course">
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in px-4">
                    <div className="glass-card rounded-3xl p-8 max-w-md w-full">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-studylabs-orange to-studylabs-purple flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <Brain size={36} className="text-white animate-pulse" />
                        </div>
                        <h2 className="text-2xl font-display font-bold text-gray-900 mb-1">Building Your Course</h2>
                        <p className="text-gray-500 text-sm mb-8">Uploading and configuring the AI engine...</p>

                        <div className="space-y-3 text-left">
                            {PROCESSING_STEPS.map((step, idx) => {
                                const Icon = step.icon;
                                const isDone = idx < processingStep;
                                const isActive = idx === processingStep;
                                return (
                                    <div
                                        key={idx}
                                        className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${
                                            isDone ? 'bg-emerald-50 border border-emerald-100' :
                                            isActive ? 'bg-orange-50 border border-orange-200' :
                                            'bg-gray-50 border border-gray-100 opacity-40'
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                            isDone ? 'bg-emerald-100 text-emerald-600' :
                                            isActive ? 'bg-studylabs-orange text-white' :
                                            'bg-gray-200 text-gray-400'
                                        }`}>
                                            {isDone ? <Check size={16} className="stroke-[3]" /> :
                                             isActive ? <Loader2 size={16} className="animate-spin" /> :
                                             <Icon size={16} />}
                                        </div>
                                        <span className={`text-sm font-medium ${
                                            isDone ? 'text-emerald-700' :
                                            isActive ? 'text-studylabs-orange font-bold' :
                                            'text-gray-400'
                                        }`}>
                                            {step.label}
                                        </span>
                                        {isDone && <Check size={14} className="ml-auto text-emerald-500 stroke-[3]" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </InstructorLayout>
        );
    }

    if (isSuccess) {
        const nodeCount = methods.getValues('nodeCount') || 10;
        const xpMultiplier = parseFloat(methods.getValues('xpMultiplier')) || 1.0;
        const title = courseSnapshot?.title || 'Your Course';

        return (
            <InstructorLayout title="Create Course">
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in px-4 py-8">
                    {/* Celebration */}
                    <div className="relative mb-6">
                        <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-200">
                            <Check size={44} className="text-white stroke-[3]" />
                        </div>
                        <div className="absolute -top-2 -right-2 animate-bounce">
                            <span className="text-2xl">🎉</span>
                        </div>
                        <div className="absolute -bottom-2 -left-2 animate-bounce" style={{ animationDelay: '0.2s' }}>
                            <span className="text-xl">⭐</span>
                        </div>
                    </div>

                    <h2 className="text-3xl font-display font-black text-gray-900 mb-2">Course Created!</h2>
                    <p className="text-gray-500 max-w-sm mb-6 text-sm">
                        Our AI is generating your learning map. This usually takes 2–3 minutes.
                    </p>

                    {/* XP Earned */}
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-full text-sm font-bold mb-6">
                        <Sparkles size={16} />
                        +{totalXP} XP Earned for creating this course!
                    </div>

                    {/* Course Summary Card */}
                    <div className="glass-card rounded-2xl p-5 max-w-sm w-full mb-6 text-left">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Course Summary</p>
                        <h3 className="font-display font-bold text-gray-900 text-lg mb-3">{title}</h3>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="text-center p-2.5 bg-purple-50 rounded-xl">
                                <p className="text-xl font-black text-studylabs-purple">{nodeCount}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">Nodes</p>
                            </div>
                            <div className="text-center p-2.5 bg-amber-50 rounded-xl">
                                <p className="text-xl font-black text-amber-600">{xpMultiplier.toFixed(1)}x</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">XP Boost</p>
                            </div>
                            <div className="text-center p-2.5 bg-emerald-50 rounded-xl">
                                <p className="text-xl font-black text-emerald-600">{Math.round(100 * xpMultiplier)}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">XP / Quiz</p>
                            </div>
                        </div>
                    </div>

                    {/* AI Generation Progress */}
                    <div className="w-full max-w-sm bg-white border border-orange-100 p-4 rounded-2xl shadow-sm flex items-center gap-3 mb-6">
                        <div className="w-9 h-9 bg-orange-100 text-studylabs-orange rounded-xl flex items-center justify-center shrink-0">
                            <Loader2 size={18} className="animate-spin" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">AI Status</p>
                            <p className="text-sm font-bold text-studylabs-orange truncate animate-pulse">{generationProgress}</p>
                        </div>
                        <Clock size={16} className="text-gray-300 shrink-0" />
                    </div>

                    <div className="flex gap-3">
                        {createdCourseId && (
                            <button
                                onClick={() => navigate(`/instructor/course/${createdCourseId}`)}
                                className="bg-studylabs-orange text-white px-6 py-2.5 rounded-xl font-bold hover:bg-studylabs-dark transition flex items-center gap-2 shadow-lg shadow-orange-200 text-sm"
                            >
                                View Course Map
                                <MapPin size={16} />
                            </button>
                        )}
                        <button
                            onClick={() => navigate('/instructor')}
                            className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition text-sm"
                        >
                            Run in Background
                        </button>
                    </div>
                </div>
            </InstructorLayout>
        );
    }

    return (
        <InstructorLayout title="New Course Wizard">
            <div className="max-w-3xl mx-auto py-6 sm:py-10 px-4 sm:px-6 md:px-0 pb-40">

                {/* XP Banner */}
                <div className="flex items-center justify-center gap-2 mb-6">
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 px-4 py-2 rounded-full">
                        <Sparkles size={14} className="text-amber-500" />
                        <span className="text-xs font-bold text-amber-700">Complete all steps to earn <span className="text-amber-600">{totalXP} XP</span></span>
                    </div>
                </div>

                {/* Stepper */}
                <div className="mb-10 relative px-2 sm:px-4">
                    {/* Background track */}
                    <div className="absolute top-5 left-8 right-8 h-1 bg-gray-100 -translate-y-1/2 z-0 rounded-full" />
                    {/* Progress line */}
                    <div
                        className="absolute top-5 left-8 h-1 bg-gradient-to-r from-studylabs-orange to-studylabs-purple -translate-y-1/2 z-0 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(217,119,87,0.4)]"
                        style={{ width: currentStep === 0 ? '0px' : `calc(${(currentStep / (steps.length - 1)) * 100}% - 16px)` }}
                    />
                    <div className="flex items-center justify-between relative z-10">
                        {steps.map((step, idx) => {
                            const isCompleted = idx < currentStep;
                            const isActive = idx === currentStep;
                            const Icon = step.icon;
                            return (
                                <div key={idx} className="flex flex-col items-center">
                                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold border-2 transition-all duration-300 relative ${
                                        isCompleted
                                            ? 'bg-gradient-to-tr from-studylabs-orange to-studylabs-purple border-transparent text-white shadow-[0_0_12px_rgba(217,119,87,0.35)]'
                                            : isActive
                                                ? 'bg-white border-studylabs-orange text-studylabs-orange shadow-[0_0_12px_rgba(217,119,87,0.2)] scale-110'
                                                : 'bg-white border-gray-200 text-gray-300'
                                    }`}>
                                        {isCompleted ? <Check size={18} className="stroke-[3]" /> : <Icon size={18} />}
                                        {isActive && (
                                            <span className="absolute -inset-1 rounded-2xl border border-studylabs-orange/40 animate-pulse pointer-events-none" />
                                        )}
                                    </div>
                                    <span className={`text-[11px] font-black uppercase tracking-wider mt-2.5 transition-colors ${
                                        isActive ? 'text-studylabs-orange' :
                                        isCompleted ? 'text-studylabs-dark/70' :
                                        'text-gray-300'
                                    }`}>
                                        {step.title}
                                    </span>
                                    {isCompleted && (
                                        <span className="text-[9px] font-bold text-amber-500 mt-0.5">+{step.xp} XP</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Step label */}
                <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
                    Step {currentStep + 1} of {steps.length}
                </p>

                {/* Form Card */}
                <FormProvider {...methods}>
                    <div className="glass-card p-5 sm:p-7 md:p-9 rounded-3xl min-h-[500px] flex flex-col justify-between">
                        <StepComponent />

                        {/* Actions */}
                        <div className="flex justify-between mt-10 pt-6 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={handleBack}
                                disabled={currentStep === 0}
                                className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition text-sm ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'text-gray-500 hover:bg-gray-100'}`}
                            >
                                <ChevronLeft size={18} />
                                Back
                            </button>

                            {currentStep === steps.length - 1 ? (
                                <button
                                    type="button"
                                    onClick={methods.handleSubmit(onSubmit)}
                                    className="bg-gradient-to-r from-studylabs-orange to-studylabs-dark text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition flex items-center gap-2 shadow-lg shadow-orange-200 text-sm"
                                >
                                    <Sparkles size={16} />
                                    Launch Course
                                    <Check size={16} className="stroke-[3]" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="bg-gray-900 text-white px-7 py-3 rounded-xl font-bold hover:bg-gray-800 transition flex items-center gap-2 text-sm"
                                >
                                    Next Step
                                    <ChevronRight size={18} />
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
