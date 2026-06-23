import { useState, useEffect, useCallback } from 'react';
import { QUIZ_TIMER_SECONDS, SPEED_BONUS_THRESHOLD } from '../constants/config';
import sounds from '../utils/soundManager';

/**
 * Manages quiz countdown timer state.
 *
 * @param {object} params
 * @param {number}   params.questionKey     - Current question index; changing it resets the timer.
 * @param {boolean}  params.isSubmitted     - When true, stops the countdown.
 * @param {boolean}  params.isSummaryQuestion - When true, timer is inactive.
 * @param {boolean}  params.isEvaluating   - When true, timer is paused.
 * @param {Function} params.onTimeUp        - Called when the timer reaches zero.
 * @returns {{ timeLeft: number, isTimeUp: boolean, speedBonusActive: boolean, setSpeedBonusActive: Function }}
 */
export const useQuizTimer = ({ questionKey, isSubmitted, isSummaryQuestion, isEvaluating, onTimeUp }) => {
    const [timeLeft, setTimeLeft] = useState(QUIZ_TIMER_SECONDS);
    const [isTimeUp, setIsTimeUp] = useState(false);
    const [speedBonusActive, setSpeedBonusActive] = useState(false);

    const handleTimeUpInternal = useCallback(() => {
        setIsTimeUp(true);
        sounds.timeUp();
        onTimeUp?.();
    }, [onTimeUp]);

    useEffect(() => {
        if (isSubmitted || isSummaryQuestion || isEvaluating) return;

        /* eslint-disable react-hooks/set-state-in-effect */
        setTimeLeft(QUIZ_TIMER_SECONDS);
        setIsTimeUp(false);
        setSpeedBonusActive(false);
        /* eslint-enable react-hooks/set-state-in-effect */

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleTimeUpInternal();
                    return 0;
                }
                if (prev <= SPEED_BONUS_THRESHOLD) sounds.timeLow();
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [questionKey, isSubmitted, isSummaryQuestion, isEvaluating, handleTimeUpInternal]);

    return { timeLeft, isTimeUp, speedBonusActive, setSpeedBonusActive };
};
