import React, { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, Video, X, Presentation } from 'lucide-react';

const StepMaterials = () => {
    const { register, setValue, watch, formState: { errors } } = useFormContext();
    const syllabus = watch('syllabus') || [];
    const materials = watch('materials') || [];

    // --- Syllabus Dropzone ---
    const onDropSyllabus = useCallback(acceptedFiles => {
        // Only keep the first file since syllabus should be just 1
        const newFile = Object.assign(acceptedFiles[0], {
            preview: URL.createObjectURL(acceptedFiles[0])
        });
        setValue('syllabus', [newFile], { shouldValidate: true });
    }, [setValue]);

    const removeSyllabus = () => {
        setValue('syllabus', [], { shouldValidate: true });
    };

    const { getRootProps: getSyllabusProps, getInputProps: getSyllabusInputProps, isDragActive: isSyllabusDragActive } = useDropzone({
        onDrop: onDropSyllabus,
        maxFiles: 1,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
        }
    });

    // --- Materials Dropzone ---
    const onDropMaterials = useCallback(acceptedFiles => {
        // Filter out duplicates by checking file name and size
        const existingFileSignatures = new Set(
            materials.map(f => `${f.name}_${f.size}`)
        );

        const uniqueNewFiles = acceptedFiles.filter(file => {
            const signature = `${file.name}_${file.size}`;
            return !existingFileSignatures.has(signature);
        });

        if (uniqueNewFiles.length < acceptedFiles.length) {
            const duplicateCount = acceptedFiles.length - uniqueNewFiles.length;
            alert(`${duplicateCount} duplicate file(s) were skipped.`);
        }

        const newFiles = uniqueNewFiles.map(file => Object.assign(file, {
            preview: URL.createObjectURL(file)
        }));
        setValue('materials', [...materials, ...newFiles], { shouldValidate: true });
    }, [materials, setValue]);

    const removeMaterial = (index) => {
        const newFiles = [...materials];
        newFiles.splice(index, 1);
        setValue('materials', newFiles, { shouldValidate: true });
    };

    const { getRootProps: getMaterialsProps, getInputProps: getMaterialsInputProps, isDragActive: isMaterialsDragActive } = useDropzone({
        onDrop: onDropMaterials,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
            'video/mp4': ['.mp4']
        }
    });

    // Hidden inputs for validation register
    React.useEffect(() => {
        register('syllabus', { required: 'Please upload a syllabus file' });
        register('materials'); // Optional
    }, [register]);

    // Cleanup preview URLs on unmount
    React.useEffect(() => {
        return () => {
            syllabus.forEach(file => {
                if (file.preview) URL.revokeObjectURL(file.preview);
            });
            materials.forEach(file => {
                if (file.preview) URL.revokeObjectURL(file.preview);
            });
        };
    }, [syllabus, materials]);

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Material Sourcing</h3>
                <p className="text-gray-500 mb-6">Upload your syllabus and course materials below.</p>
            </div>

            {/* Syllabus Section */}
            <div className="space-y-3">
                <h4 className="font-bold text-gray-700">Course Syllabus <span className="text-red-500">*</span></h4>
                
                {syllabus.length === 0 ? (
                    <div
                        {...getSyllabusProps()}
                        className={`border-4 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${isSyllabusDragActive ? 'border-studylabs-blue bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
                    >
                        <input {...getSyllabusInputProps()} />
                        <div className="w-12 h-12 bg-blue-100 text-studylabs-blue rounded-full flex items-center justify-center mb-3">
                            <UploadCloud size={24} />
                        </div>
                        <p className="font-bold text-gray-700">
                            {isSyllabusDragActive ? "Drop syllabus here..." : "Drag & Drop syllabus or click"}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">1 PDF or PPTX file only</p>
                    </div>
                ) : (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100 shadow-sm">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-blue-100 rounded-lg text-studylabs-blue shrink-0">
                                {syllabus[0].type.includes('presentation') ? <Presentation size={20} /> : <FileText size={20} />}
                            </div>
                            <span className="truncate font-medium text-studylabs-blue">{syllabus[0].name}</span>
                            <span className="text-xs text-blue-400 shrink-0">{(syllabus[0].size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                        <button
                            type="button"
                            onClick={removeSyllabus}
                            className="p-1 hover:bg-blue-100 text-blue-400 hover:text-studylabs-blue rounded-full transition"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}
                {errors.syllabus && <p className="text-red-500 text-sm mt-1">{errors.syllabus.message}</p>}
            </div>

            <hr className="border-gray-100" />

            {/* Course Materials Section */}
            <div className="space-y-3">
                <h4 className="font-bold text-gray-700">Course Materials <span className="text-sm font-normal text-gray-400">(Optional)</span></h4>
                <div
                    {...getMaterialsProps()}
                    className={`border-4 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${isMaterialsDragActive ? 'border-studylabs-blue bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
                >
                    <input {...getMaterialsInputProps()} />
                    <div className="w-12 h-12 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center mb-3">
                        <UploadCloud size={24} />
                    </div>
                    <p className="font-bold text-gray-700">
                        {isMaterialsDragActive ? "Drop files here..." : "Drag & Drop course materials"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Supports PDF, PPTX & MP4</p>
                </div>

                {materials.length > 0 && (
                    <div className="space-y-2 mt-4">
                        <h5 className="font-bold text-xs text-gray-500 uppercase tracking-wide">Uploaded Materials ({materials.length})</h5>
                        {materials.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="p-2 bg-gray-100 rounded-lg text-gray-600 shrink-0">
                                        {file.type.includes('pdf') ? <FileText size={20} /> : file.type.includes('presentation') ? <Presentation size={20} /> : <Video size={20} />}
                                    </div>
                                    <span className="truncate font-medium text-gray-700">{file.name}</span>
                                    <span className="text-xs text-gray-400 shrink-0">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeMaterial(idx)}
                                    className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StepMaterials;
