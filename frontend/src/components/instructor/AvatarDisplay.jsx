import React, { useState } from 'react';

/** User avatar — renders an image URL or falls back to an emoji / initial tile. */
const AvatarDisplay = ({ avatar, size = 'w-10 h-10', name }) => {
    const [imgError, setImgError] = useState(false);

    const isUrl = avatar && (avatar.startsWith('http') || avatar.startsWith('/')) && !imgError;

    if (isUrl) {
        return (
            <img
                src={avatar}
                alt={name ? `${name}'s avatar` : 'User avatar'}
                onError={() => setImgError(true)}
                className={`${size} rounded-full border border-slate-200 dark:border-white/10 flex-shrink-0 object-cover`}
            />
        );
    }

    const initial = name ? name.charAt(0).toUpperCase() : '🎓';
    const displayValue =
        avatar && avatar.length <= 4 && !['default', 'none'].includes(avatar.toLowerCase())
            ? avatar
            : initial;

    return (
        <div
            className={`${size} rounded-full bg-gradient-to-br from-[#D97757]/20 to-purple-500/20 border border-[#D97757]/30 text-slate-800 dark:text-white font-bold flex items-center justify-center text-sm flex-shrink-0 select-none shadow-sm`}
        >
            {displayValue}
        </div>
    );
};

export default AvatarDisplay;
