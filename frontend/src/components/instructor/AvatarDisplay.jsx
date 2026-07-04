import React from 'react';

/** Student avatar — renders an image URL or falls back to an emoji tile. */
const AvatarDisplay = ({ avatar, size = 'w-10 h-10', name }) => {
    if (avatar && (avatar.startsWith('http') || avatar.startsWith('/'))) {
        return (
            <img
                src={avatar}
                alt={name ? `${name}'s avatar` : 'Student avatar'}
                className={`${size} rounded-full border border-slate-200 dark:border-white/10 flex-shrink-0 object-cover`}
            />
        );
    }
    return (
        <div
            className={`${size} rounded-full bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/5 flex items-center justify-center text-base flex-shrink-0 select-none`}
        >
            {avatar || '🎓'}
        </div>
    );
};

export default AvatarDisplay;
