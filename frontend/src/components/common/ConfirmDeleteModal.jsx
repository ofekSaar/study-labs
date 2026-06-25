import React from 'react';
import BaseModal from './BaseModal';

const ConfirmDeleteModal = ({ label, onConfirm, onCancel }) => (
    <BaseModal isOpen onClose={onCancel} size="sm" hideClose bodyClassName="p-6">
        <div className="text-center space-y-4">
            <div className="text-4xl">🗑️</div>
            <p className="text-slate-800 dark:text-white font-bold text-sm">Delete {label}?</p>
            <p className="text-slate-500 dark:text-white/50 text-xs">This action is permanent and cannot be undone.</p>
            <div className="flex gap-3 justify-center pt-1">
                <button
                    onClick={onCancel}
                    className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/70 text-sm font-bold hover:bg-slate-200 dark:hover:bg-white/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                >
                    Delete
                </button>
            </div>
        </div>
    </BaseModal>
);

export default ConfirmDeleteModal;
