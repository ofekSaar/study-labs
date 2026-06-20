import { XP_PER_LEVEL, SHOP_ITEMS } from '../constants/gamification';
import { MS_PER_DAY } from '../constants/config';

/**
 * Converts total XP to a level number.
 * @param {number} totalXP
 * @returns {number}
 */
export const calculateLevel = (totalXP) => Math.floor(totalXP / XP_PER_LEVEL) + 1;

/**
 * Picks the daily featured shop item using the day-of-year as a rotating seed.
 * @param {Date} [date=new Date()]
 * @returns {object} shop item with `category` field added
 */
export const getDailyFeaturedItem = (date = new Date()) => {
    const allItems = [
        ...SHOP_ITEMS.avatars.map((i) => ({ ...i, category: 'avatars' })),
        ...SHOP_ITEMS.titles.map((i) => ({ ...i, category: 'titles' })),
        ...SHOP_ITEMS.themes.map((i) => ({ ...i, category: 'themes' })),
        ...SHOP_ITEMS.frames.map((i) => ({ ...i, category: 'frames' })),
    ];
    const startOfYear = new Date(date.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((date - startOfYear) / MS_PER_DAY);
    return allItems[dayOfYear % allItems.length];
};
