import React, { useCallback, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import {
    UploadCloud,
    FileText,
    Video,
    X,
    Presentation,
    FileSpreadsheet,
    CheckCircle2,
    Sparkles,
    Eye,
    Info,
} from 'lucide-react';
import useToastStore from '../../store/toastStore';

const FILE_TYPE_META = {
    pdf: { label: 'PDF', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    pptx: {
        label: 'PPTX',
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
    },
    docx: { label: 'DOCX', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    xlsx: { label: 'XLSX', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    mp4: {
        label: 'MP4',
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
    },
};

const getFileMeta = (file) => {
    if (file.type?.includes('pdf') || file.name?.endsWith('.pdf')) return FILE_TYPE_META.pdf;
    if (file.type?.includes('presentation') || file.name?.endsWith('.pptx'))
        return FILE_TYPE_META.pptx;
    if (file.type?.includes('wordprocessing') || file.name?.endsWith('.docx'))
        return FILE_TYPE_META.docx;
    if (file.type?.includes('spreadsheet') || file.name?.endsWith('.xlsx'))
        return FILE_TYPE_META.xlsx;
    if (file.type?.includes('mp4') || file.name?.endsWith('.mp4')) return FILE_TYPE_META.mp4;
    return { label: 'FILE', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
};

const getFileIcon = (file) => {
    if (file.type?.includes('pdf') || file.name?.endsWith('.pdf')) return FileText;
    if (file.type?.includes('presentation') || file.name?.endsWith('.pptx')) return Presentation;
    if (file.type?.includes('spreadsheet') || file.name?.endsWith('.xlsx')) return FileSpreadsheet;
    if (file.type?.includes('mp4') || file.name?.endsWith('.mp4')) return Video;
    return FileText;
};

const materialQuality = (count) => {
    if (count === 0) return { label: 'No materials yet', color: 'text-gray-400', bar: 0 };
    if (count === 1)
        return { label: 'Add more for better AI results', color: 'text-amber-600', bar: 33 };
    if (count === 2) return { label: 'Getting better!', color: 'text-amber-500', bar: 66 };
    return { label: 'Great! AI has plenty to work with', color: 'text-emerald-600', bar: 100 };
};

const StepMaterials = () => {
    const {
        register,
        setValue,
        watch,
        formState: { errors },
    } = useFormContext();
    const watchedSyllabus = watch('syllabus');
    const syllabus = useMemo(() => watchedSyllabus || [], [watchedSyllabus]);
    const watchedMaterials = watch('materials');
    const materials = useMemo(() => watchedMaterials || [], [watchedMaterials]);
    const analyzeImages = watch('analyzeImages');

    const quality = materialQuality(materials.length);

    const onDropSyllabus = useCallback(
        (acceptedFiles) => {
            const newFile = Object.assign(acceptedFiles[0], {
                preview: URL.createObjectURL(acceptedFiles[0]),
            });
            setValue('syllabus', [newFile], { shouldValidate: true });
        },
        [setValue]
    );

    const removeSyllabus = () => setValue('syllabus', [], { shouldValidate: true });

    const {
        getRootProps: getSyllabusProps,
        getInputProps: getSyllabusInputProps,
        isDragActive: isSyllabusDragActive,
    } = useDropzone({
        onDrop: onDropSyllabus,
        maxFiles: 1,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        },
    });

    const onDropMaterials = useCallback(
        (acceptedFiles) => {
            const existingFileSignatures = new Set(materials.map((f) => `${f.name}_${f.size}`));
            const uniqueNewFiles = acceptedFiles.filter(
                (file) => !existingFileSignatures.has(`${file.name}_${file.size}`)
            );
            if (uniqueNewFiles.length < acceptedFiles.length) {
                useToastStore
                    .getState()
                    .info(
                        'Duplicate files skipped',
                        `${acceptedFiles.length - uniqueNewFiles.length} duplicate file(s) were skipped.`
                    );
            }
            const newFiles = uniqueNewFiles.map((file) =>
                Object.assign(file, { preview: URL.createObjectURL(file) })
            );
            setValue('materials', [...materials, ...newFiles], { shouldValidate: true });
        },
        [materials, setValue]
    );

    const removeMaterial = (index) => {
        const newFiles = [...materials];
        newFiles.splice(index, 1);
        setValue('materials', newFiles, { shouldValidate: true });
    };

    const {
        getRootProps: getMaterialsProps,
        getInputProps: getMaterialsInputProps,
        isDragActive: isMaterialsDragActive,
    } = useDropzone({
        onDrop: onDropMaterials,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'video/mp4': ['.mp4'],
        },
    });

    React.useEffect(() => {
        register('syllabus', { required: 'Please upload a syllabus file' });
        register('materials');
        register('analyzeImages');
    }, [register]);

    React.useEffect(() => {
        return () => {
            syllabus.forEach((file) => {
                if (file.preview) URL.revokeObjectURL(file.preview);
            });
            materials.forEach((file) => {
                if (file.preview) URL.revokeObjectURL(file.preview);
            });
        };
    }, [syllabus, materials]);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-2xl font-display font-bold text-gray-900">
                        Course Materials
                    </h3>
                    <p className="text-gray-500 mt-1">
                        Upload your syllabus and course materials below.
                    </p>
                </div>
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-full text-xs font-bold shrink-0">
                    <Sparkles size={12} />
                    +50 XP
                </div>
            </div>

            {/* Syllabus Section */}
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-800 text-sm">Course Syllabus</h4>
                    <span className="text-red-500 text-xs font-bold">Required</span>
                    {syllabus.length > 0 && (
                        <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
                            <CheckCircle2 size={13} />
                            Uploaded
                        </span>
                    )}
                </div>

                {syllabus.length === 0 ? (
                    <div
                        {...getSyllabusProps()}
                        className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200
                            ${
                                isSyllabusDragActive
                                    ? 'border-studylabs-orange bg-orange-50 scale-[1.01]'
                                    : 'border-gray-200 hover:border-studylabs-orange hover:bg-orange-50/40'
                            }`}
                    >
                        <input {...getSyllabusInputProps()} />
                        <div
                            className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-all duration-200 ${isSyllabusDragActive ? 'bg-studylabs-orange text-white scale-110' : 'bg-orange-100 text-studylabs-orange'}`}
                        >
                            <UploadCloud
                                size={28}
                                className={isSyllabusDragActive ? 'animate-bounce' : ''}
                            />
                        </div>
                        <p className="font-bold text-gray-800 text-sm">
                            {isSyllabusDragActive
                                ? 'Drop syllabus here...'
                                : 'Drag & Drop syllabus'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            or{' '}
                            <span className="text-studylabs-orange font-semibold">
                                click to browse
                            </span>
                        </p>
                        <p className="text-xs text-gray-300 mt-2">PDF, PPTX or DOCX</p>
                    </div>
                ) : (
                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-600 shrink-0">
                                <CheckCircle2 size={20} />
                            </div>
                            <div className="overflow-hidden">
                                <p className="truncate font-bold text-emerald-800 text-sm">
                                    {syllabus[0].name}
                                </p>
                                <p className="text-xs text-emerald-500">
                                    {(syllabus[0].size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={removeSyllabus}
                            className="p-1.5 hover:bg-emerald-100 text-emerald-400 hover:text-emerald-600 rounded-xl transition"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}
                {errors.syllabus && (
                    <p className="text-red-500 text-xs font-medium">{errors.syllabus.message}</p>
                )}
            </div>

            <div className="border-t border-gray-100" />

            {/* Materials Section */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-800 text-sm">
                        Course Materials{' '}
                        <span className="text-gray-400 font-normal">(Optional)</span>
                    </h4>
                    {materials.length > 0 && (
                        <span className="text-xs font-bold text-gray-500">
                            {materials.length} file{materials.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                {/* AI Quality Indicator */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-amber-400 to-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${quality.bar}%` }}
                        />
                    </div>
                    <span className={`text-xs font-medium shrink-0 ${quality.color}`}>
                        {quality.label}
                    </span>
                </div>

                <div
                    {...getMaterialsProps()}
                    className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200
                        ${
                            isMaterialsDragActive
                                ? 'border-studylabs-purple bg-purple-50 scale-[1.01]'
                                : 'border-gray-200 hover:border-studylabs-purple hover:bg-purple-50/30'
                        }`}
                >
                    <input {...getMaterialsInputProps()} />
                    <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 transition-all duration-200 ${isMaterialsDragActive ? 'bg-studylabs-purple text-white scale-110' : 'bg-purple-100 text-studylabs-purple'}`}
                    >
                        <UploadCloud
                            size={24}
                            className={isMaterialsDragActive ? 'animate-bounce' : ''}
                        />
                    </div>
                    <p className="font-bold text-gray-700 text-sm">
                        {isMaterialsDragActive ? 'Drop files here...' : 'Drag & Drop materials'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PDF, PPTX, DOCX, XLSX & MP4</p>
                </div>

                {materials.length > 0 && (
                    <div className="space-y-2">
                        {materials.map((file, idx) => {
                            const meta = getFileMeta(file);
                            const Icon = getFileIcon(file);
                            return (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div
                                            className={`p-2 rounded-lg ${meta.bg} ${meta.color} shrink-0`}
                                        >
                                            <Icon size={16} />
                                        </div>
                                        <span className="truncate font-medium text-gray-700 text-sm">
                                            {file.name}
                                        </span>
                                        <span
                                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${meta.bg} ${meta.color} ${meta.border} border shrink-0`}
                                        >
                                            {meta.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                        <span className="text-xs text-gray-400">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeMaterial(idx)}
                                            className="p-1 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-lg transition"
                                        >
                                            <X size={15} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StepMaterials;
