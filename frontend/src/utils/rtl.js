/**
 * Utility to detect if a string contains RTL characters (Hebrew, Arabic, etc.)
 */
export const isRTL = (text) => {
    if (!text) return false;
    const rtlChar = /[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F]/;
    return rtlChar.test(String(text));
};

/**
 * Returns 'rtl' or 'ltr' based on content
 */
export const getDirection = (text) => {
    return isRTL(text) ? 'rtl' : 'ltr';
};
