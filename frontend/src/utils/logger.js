/**
 * Central logging wrapper.
 *
 * Use instead of raw console.* so log output has one owner:
 * debug/info are silenced in production builds, errors and warnings
 * always pass through (and can later be wired to a reporting service).
 */
const isDev = import.meta.env.DEV;

const logger = {
    debug: (...args) => {
        if (isDev) console.debug(...args);
    },
    info: (...args) => {
        if (isDev) console.info(...args);
    },
    warn: (...args) => console.warn(...args),
    error: (...args) => console.error(...args),
};

export default logger;
