import React from 'react';
import { Moon, Sun, Volume2, VolumeX, Sparkles, Monitor, Award, Lock } from 'lucide-react';
import useSettingsStore from '../../store/settingsStore';
import useGamificationStore, {
    AVATARS,
    INSTRUCTOR_AVATARS,
    TITLES,
} from '../../store/gamificationStore';
import sounds from '../../utils/soundManager';
import api from '../../utils/api';
import useAuthStore from '../../store/authStore';
import useToastStore from '../../store/toastStore';
import BaseModal from '../common/BaseModal';

const SettingsModal = ({ isOpen, onClose, isInstructor = false }) => {
    const { theme, setTheme, animationsEnabled, toggleAnimations, soundEnabled, toggleSound } =
        useSettingsStore();
    const {
        activeAvatar,
        activeTitle,
        unlockedAvatars,
        unlockedTitles,
        selectAvatar,
        selectTitle,
    } = useGamificationStore();

    const handleSelectAvatar = async (id) => {
        sounds.click();
        selectAvatar(id);

        const list = isInstructor ? INSTRUCTOR_AVATARS : AVATARS;
        const selected = list.find((a) => a.id === id);
        if (selected) {
            try {
                await api.put('/api/auth/profile', { avatar: selected.emoji });
                await useAuthStore.getState().initialize();
            } catch (err) {
                console.error('Failed to sync avatar with database:', err);
                useToastStore
                    .getState()
                    .error(
                        'Avatar not saved',
                        'Your avatar changed locally, but failed to sync — it may reset on your next login.'
                    );
            }
        }
    };

    const handleSelectTitle = (id) => {
        sounds.click();
        selectTitle(id);
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Settings & Customization"
            size="lg"
            bodyClassName="p-4 sm:p-6 overflow-y-auto custom-scrollbar"
            footer={
                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors text-xs uppercase tracking-wider"
                    >
                        Done
                    </button>
                </div>
            }
        >
            <div className="space-y-6 sm:space-y-8">
                {/* Theme Selection */}
                <div>
                    <h3 className="text-xs font-black text-slate-400 dark:text-white/30 uppercase tracking-widest mb-4">
                        Appearance
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={() => setTheme('light')}
                            className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${theme === 'light' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'border-slate-100 dark:border-white/5 text-slate-600 dark:text-white/60 hover:border-slate-200 dark:hover:border-white/10'}`}
                        >
                            <Sun size={20} className="mb-2" />
                            <span className="text-xs font-bold">Light</span>
                        </button>
                        <button
                            onClick={() => setTheme('dark')}
                            className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${theme === 'dark' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'border-slate-100 dark:border-white/5 text-slate-600 dark:text-white/60 hover:border-slate-200 dark:hover:border-white/10'}`}
                        >
                            <Moon size={20} className="mb-2" />
                            <span className="text-xs font-bold">Dark</span>
                        </button>
                        <button
                            onClick={() => setTheme('system')}
                            className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${theme === 'system' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'border-slate-100 dark:border-white/5 text-slate-600 dark:text-white/60 hover:border-slate-200 dark:hover:border-white/10'}`}
                        >
                            <Monitor size={20} className="mb-2" />
                            <span className="text-xs font-bold">System</span>
                        </button>
                    </div>
                </div>

                {/* Sound & Animations Preferences */}
                <div>
                    <h3 className="text-xs font-black text-slate-400 dark:text-white/30 uppercase tracking-widest mb-4">
                        Preferences
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/3 border border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                                    <Sparkles size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-800 dark:text-white">
                                        Animations
                                    </p>
                                    <p className="text-[10px] text-slate-400 dark:text-white/30 mt-0.5">
                                        Enable modern fluid UI transitions
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={toggleAnimations}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${animationsEnabled ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-white/10'}`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${animationsEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                                />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/3 border border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                                    {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                                </div>
                                <div>
                                    <p className="text-xs font-black text-slate-800 dark:text-white">
                                        Sound Effects
                                    </p>
                                    <p className="text-[10px] text-slate-400 dark:text-white/30 mt-0.5">
                                        Play dynamic reward tones
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={toggleSound}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${soundEnabled ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-white/10'}`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${soundEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                                />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Profile Customization (Avatars & Titles) */}
                <div className="border-t border-slate-100 dark:border-white/5 pt-6 space-y-6">
                    <div>
                        <h3 className="text-xs font-black text-slate-400 dark:text-white/30 uppercase tracking-widest mb-1 flex items-center gap-2">
                            <Award size={14} className="text-indigo-500" />
                            Profile Customization
                        </h3>
                        <p className="text-[10px] text-slate-400 dark:text-white/30 mb-4 font-bold uppercase tracking-wider">
                            {isInstructor
                                ? 'Choose your professional academic avatar!'
                                : 'Unlock custom identities by leveling up!'}
                        </p>
                    </div>

                    {/* Avatar selector */}
                    <div>
                        <h4 className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest mb-3">
                            Choose Avatar
                        </h4>
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                            {(isInstructor ? INSTRUCTOR_AVATARS : AVATARS).map((av) => {
                                const isUnlocked = isInstructor
                                    ? true
                                    : unlockedAvatars.includes(av.id);
                                const isActive = isInstructor
                                    ? activeAvatar === av.id ||
                                      (activeAvatar === 'default' && av.id === 'default_inst')
                                    : activeAvatar === av.id;

                                return (
                                    <button
                                        key={av.id}
                                        disabled={!isUnlocked}
                                        onClick={() => handleSelectAvatar(av.id)}
                                        className={`relative w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all border-2 group ${
                                            isActive
                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 shadow-md shadow-indigo-500/10'
                                                : isUnlocked
                                                  ? 'border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 bg-slate-50 dark:bg-white/3'
                                                  : 'border-slate-100 dark:border-white/2 opacity-35 grayscale cursor-not-allowed bg-slate-100 dark:bg-white/1'
                                        }`}
                                    >
                                        {av.emoji}
                                        {!isUnlocked && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/10 dark:bg-black/35 rounded-2xl">
                                                <Lock size={10} className="text-white" />
                                            </div>
                                        )}

                                        {/* Tooltip */}
                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-lg p-1.5 shadow-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none text-[9px] w-24 text-center z-50 border border-white/5 font-black uppercase">
                                            {isUnlocked ? av.name : `Level ${av.levelReq}`}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Custom Title Selector */}
                    {!isInstructor && (
                        <div>
                            <h4 className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest mb-3">
                                Choose Title
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {TITLES.map((t) => {
                                    const isUnlocked = unlockedTitles.includes(t.id);
                                    const isActive = activeTitle === t.id;

                                    return (
                                        <button
                                            key={t.id}
                                            disabled={!isUnlocked}
                                            onClick={() => handleSelectTitle(t.id)}
                                            className={`relative px-3 py-1.5 rounded-xl border-2 text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 group ${
                                                isActive
                                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                                    : isUnlocked
                                                      ? 'border-slate-100 dark:border-white/5 text-slate-600 dark:text-white/60 hover:border-slate-200 bg-slate-50 dark:bg-white/3'
                                                      : 'border-slate-100 dark:border-white/2 opacity-35 grayscale cursor-not-allowed text-slate-400 bg-slate-100'
                                            }`}
                                        >
                                            {!isUnlocked && <Lock size={8} />}
                                            {t.name}

                                            {/* Tooltip */}
                                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-lg p-1.5 shadow-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none text-[9px] w-24 text-center z-50 border border-white/5 font-black uppercase">
                                                {isUnlocked ? 'Unlocked' : `Level ${t.levelReq}`}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </BaseModal>
    );
};

export default SettingsModal;
