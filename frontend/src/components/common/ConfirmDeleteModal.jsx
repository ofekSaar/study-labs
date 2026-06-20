import React from 'react';

const ConfirmDeleteModal = ({ label, onConfirm, onCancel }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full text-center space-y-4">
            <div className="text-4xl">🗑️</div>
            <p className="text-white font-bold text-sm">Delete {label}?</p>
            <p className="text-white/50 text-xs">This action is permanent and cannot be undone.</p>
            <div className="flex gap-3 justify-center">
                <button
                    onClick={onCancel}
                    className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-bold hover:bg-white/10 transition"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition"
                >
                    Delete
                </button>
            </div>
        </div>
    </div>
);

export default ConfirmDeleteModal;
