import React, { useState, useEffect } from 'react';
import InstructorLayout from '../components/layout/InstructorLayout';
import { useForm, FormProvider } from 'react-hook-form';
import { ChevronRight, ChevronLeft, Check, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

// Steps
import StepCoreDetails from '../components/wizard/StepCoreDetails';
import StepMaterials from '../components/wizard/StepMaterials';
import StepAIConfig from '../components/wizard/StepAIConfig';
import StepGamification from '../components/wizard/StepGamification';

const steps = [
    { title: 'Details', component: StepCoreDetails },
    { title: 'Materials', component: StepMaterials },
    { title: 'AI Config', component: StepAIConfig },
    { title: 'Gamification', component: StepGamification }
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
                    <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">Generating Course!</h2>
                    <p className="text-gray-500 max-w-md mb-4">
                        Our AI is now processing your materials and generating the learning map. This usually takes about 2-3 minutes.
                    </p>
                    <div className="w-full max-w-md bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex items-center gap-4 mb-8 text-left">
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
            <div className="max-w-3xl mx-auto py-12 px-6 md:px-0 pb-40">
                {/* Stepper Header */}
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-4 px-2">
                        {steps.map((step, idx) => (
                            <div key={idx} className={`flex flex-col items-center gap-2 ${idx <= currentStep ? 'text-studylabs-blue' : 'text-gray-300'}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all ${idx < currentStep ? 'bg-studylabs-blue text-white border-studylabs-blue' :
                                        idx === currentStep ? 'bg-white text-studylabs-blue border-studylabs-blue' :
                                            'bg-white text-gray-300 border-gray-200'
                                    }`}>
                                    {idx < currentStep ? <Check size={20} /> : idx + 1}
                                </div>
                                <span className="text-xs font-bold hidden md:block">{step.title}</span>
                            </div>
                        ))}
                    </div>
                    {/* Progress Line */}
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-studylabs-blue transition-all duration-300"
                            style={{ width: `${((currentStep) / (steps.length - 1)) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Form Content */}
                <FormProvider {...methods}>
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl min-h-[500px] flex flex-col justify-between">

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
