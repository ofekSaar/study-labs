import React, { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, Video, X } from 'lucide-react';

const StepMaterials = () => {
    const { register, setValue, watch, formState: { errors } } = useFormContext();
    const files = watch('files') || [];

    const onDrop = useCallback(acceptedFiles => {
        // Append new files to existing ones
        // In a real app we'd handle file objects better, for now just storing name/type/preview
        const newFiles = acceptedFiles.map(file => Object.assign(file, {
            preview: URL.createObjectURL(file)
        }));
        setValue('files', [...files, ...newFiles], { shouldValidate: true });
    }, [files, setValue]);

    const removeFile = (index) => {
        const newFiles = [...files];
        newFiles.splice(index, 1);
        setValue('files', newFiles, { shouldValidate: true });
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'video/mp4': ['.mp4']
        }
    });

    // Hidden input for validation register
    React.useEffect(() => {
        register('files', { required: 'Please upload at least one file' });
    }, [register]);

    return (
        <div className="space-y-6 animate-fade-in">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Material Sourcing</h3>
            <p className="text-gray-500 mb-6">Upload your syllabus, handouts, and lecture recordings.</p>

            <div
                {...getRootProps()}
                className={`border-4 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${isDragActive ? 'border-studylabs-blue bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
            >
                <input {...getInputProps()} />
                <div className="w-16 h-16 bg-blue-100 text-studylabs-blue rounded-full flex items-center justify-center mb-4">
                    <UploadCloud size={32} />
                </div>
                <p className="font-bold text-gray-700 text-lg">
                    {isDragActive ? "Drop files here..." : "Drag & Drop files here, or click to select"}
                </p>
                <p className="text-sm text-gray-400 mt-2">Supports PDF & MP4</p>
            </div>
            {errors.files && <p className="text-red-500 text-center text-sm">{errors.files.message}</p>}

            {/* File List */}
            {files.length > 0 && (
                <div className="space-y-3 mt-6">
                    <h4 className="font-bold text-sm text-gray-500 uppercase tracking-wide">Uploaded Files ({files.length})</h4>
                    {files.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 bg-gray-100 rounded-lg text-gray-600 shrink-0">
                                    {file.type.includes('pdf') ? <FileText size={20} /> : <Video size={20} />}
                                </div>
                                <span className="truncate font-medium text-gray-700">{file.name}</span>
                                <span className="text-xs text-gray-400 shrink-0">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeFile(idx)}
                                className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StepMaterials;
