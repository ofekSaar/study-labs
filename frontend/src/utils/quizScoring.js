import { QUIZ_TIMER_SECONDS, SPEED_BONUS_THRESHOLD, XP_MCQ_BASE, XP_MCQ_BONUS, XP_OPEN_BASE, XP_OPEN_BONUS } from '../constants/config';

const OPEN_SPEED_THRESHOLD_SECONDS = 10;

/**
 * Calculates XP for a correctly answered MCQ.
 *
 * @param {number} timeTaken    - Seconds elapsed since question appeared.
 * @param {number} multiplier   - XP multiplier from gamification store.
 * @returns {{ xp: number, gotSpeedBonus: boolean }}
 */
export const calcMCQScore = (timeTaken, multiplier) => {
    const gotSpeedBonus = timeTaken <= (QUIZ_TIMER_SECONDS - SPEED_BONUS_THRESHOLD);
    const xp = Math.round((gotSpeedBonus ? XP_MCQ_BONUS : XP_MCQ_BASE) * multiplier);
    return { xp, gotSpeedBonus };
};

/**
 * Calculates XP for a correctly answered open question.
 *
 * @param {number} timeTaken    - Seconds elapsed since question appeared.
 * @param {number} multiplier   - XP multiplier from gamification store.
 * @returns {{ xp: number, gotSpeedBonus: boolean }}
 */
export const calcOpenScore = (timeTaken, multiplier) => {
    const gotSpeedBonus = timeTaken <= OPEN_SPEED_THRESHOLD_SECONDS;
    const xp = Math.round((gotSpeedBonus ? XP_OPEN_BONUS : XP_OPEN_BASE) * multiplier);
    return { xp, gotSpeedBonus };
};
