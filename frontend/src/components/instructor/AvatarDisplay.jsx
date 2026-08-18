import React, { useState } from 'react';

/**
 * User avatar. Prefers the provider photo, then the cosmetic emoji, then initials.
 *
 * Google's CDN rejects requests that carry a Referer, and its URLs expire, so the
 * image is loaded with `no-referrer` and falls back to the emoji/initials tile if
 * it still fails.
 */
const AvatarDisplay = ({ photoUrl, avatar, size = 'w-10 h-10', shape = 'rounded-full', name }) => {
    const [failed, setFailed] = useState(false);

    // Older records stored the provider photo in `avatar`; keep reading it as a URL.
    const src = photoUrl || (/^(https?:\/\/|\/)/.test(avatar ?? '') ? avatar : null);
    const emoji = /^(https?:\/\/|\/)/.test(avatar ?? '') ? null : avatar;

    if (src && !failed) {
        return (
            <img
                src={src}
                alt={name ? `${name}'s avatar` : 'User avatar'}
                referrerPolicy="no-referrer"
                loading="lazy"
                onError={() => setFailed(true)}
                className={`${size} ${shape} border border-slate-200 dark:border-white/10 flex-shrink-0 object-cover bg-slate-100 dark:bg-white/10`}
            />
        );
    }

    return (
        <div
            className={`${size} ${shape} bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/5 flex items-center justify-center text-base flex-shrink-0 select-none font-black text-purple-600 dark:text-purple-400`}
        >
            {emoji || name?.trim()?.[0]?.toUpperCase() || '🎓'}
        </div>
    );
};

export default AvatarDisplay;
