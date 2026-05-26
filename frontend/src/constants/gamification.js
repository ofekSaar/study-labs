export const AVATARS = [
    { id: 'default', emoji: '🎓', name: 'Student', levelReq: 1 },
    { id: 'scholar', emoji: '📚', name: 'Scholar', levelReq: 2 },
    { id: 'brainiac', emoji: '🧠', name: 'Brainiac', levelReq: 3 },
    { id: 'speedy', emoji: '⚡', name: 'Speed Demon', levelReq: 4 },
    { id: 'ninja', emoji: '🥷', name: 'Code Ninja', levelReq: 5 },
    { id: 'wizard', emoji: '🧙‍♂️', name: 'AI Sorcerer', levelReq: 6 },
    { id: 'legendary', emoji: '👑', name: 'Grandmaster', levelReq: 8 }
];

export const INSTRUCTOR_AVATARS = [
    { id: 'default_inst', emoji: '👨‍🏫', name: 'Professor Male', levelReq: 1 },
    { id: 'female_prof', emoji: '👩‍🏫', name: 'Professor Female', levelReq: 1 },
    { id: 'scientist', emoji: '🔬', name: 'Researcher', levelReq: 1 },
    { id: 'mentor', emoji: '🤝', name: 'Mentor', levelReq: 1 },
    { id: 'genius', emoji: '💡', name: 'Idea Guru', levelReq: 1 },
    { id: 'expert', emoji: '🧠', name: 'Subject Expert', levelReq: 1 },
    { id: 'director', emoji: '🏛️', name: 'Academic Dean', levelReq: 1 }
];

export const TITLES = [
    { id: 'beginner', name: 'Beginner', levelReq: 1 },
    { id: 'curious', name: 'Curious Learner', levelReq: 2 },
    { id: 'seeker', name: 'Knowledge Seeker', levelReq: 3 },
    { id: 'runner', name: 'Speed Runner', levelReq: 4 },
    { id: 'ninja', name: 'Code Ninja', levelReq: 5 },
    { id: 'sorcerer', name: 'AI Sorcerer', levelReq: 6 },
    { id: 'grandmaster', name: 'Grandmaster', levelReq: 8 }
];

export const QUEST_DEFINITIONS = {
    daily: [
        { id: 'daily_complete_lesson', title: 'Complete a lesson today', action: 'complete_lesson', target: 1, xp: 120, icon: '🎓' },
        { id: 'daily_perfect_quiz', title: 'Score 100% on a quiz', action: 'perfect_quiz', target: 1, xp: 200, icon: '🎯' },
        { id: 'daily_speed_demon', title: 'Speed Bonus: Answer in under 5s', action: 'speed_bonus', target: 1, xp: 150, icon: '⚡' },
    ],
    weekly: [
        { id: 'weekly_lessons', title: 'Complete 5 lessons this week', action: 'complete_lesson', target: 5, xp: 500, icon: '📖' },
        { id: 'weekly_perfect_quizzes', title: 'Score 100% on 3 quizzes', action: 'perfect_quiz', target: 3, xp: 600, icon: '💎' },
        { id: 'weekly_speed_demon', title: 'Earn 3 Speed Bonuses', action: 'speed_bonus', target: 3, xp: 450, icon: '⚡' },
    ],
    milestone: [
        { id: 'milestone_level_10', title: 'Reach Level 10', action: 'level', target: 10, xp: 1000, icon: '👑' },
        { id: 'milestone_lessons_25', title: 'Complete 25 lessons total', action: 'complete_lesson', target: 25, xp: 800, icon: '🏆' },
        { id: 'milestone_perfect_quizzes_10', title: 'Get 10 perfect quizzes', action: 'perfect_quiz', target: 10, xp: 1200, icon: '🥇' },
    ]
};

export const SHOP_ITEMS = {
    avatars: [
        { id: 'wizard_scholar', emoji: '🧙‍♂️', name: 'Wizard Scholar', cost: 150, description: 'A mystical master of educational wisdom.' },
        { id: 'cyber_learner', emoji: '👾', name: 'Cyber Learner', cost: 250, description: 'Direct neural interface to the study database.' },
        { id: 'unicorn_scholar', emoji: '🦄', name: 'Academic Unicorn', cost: 400, description: 'A rare creature of unparalleled brilliance.' }
    ],
    titles: [
        { id: 'knowledge_alchemist', name: 'Alchemist of Knowledge', cost: 100, description: 'Transmuting study time into pure genius.' },
        { id: 'ultimate_mind', name: 'Ultimate Mind', cost: 200, description: 'Capable of storing infinite amounts of material.' },
        { id: 'legendary_scholar', name: 'Legendary Scholar', cost: 350, description: 'Your achievements will be spoken of for generations.' }
    ],
    powerups: [
        { id: 'streak_shield', emoji: '🛡️', name: 'Streak Shield', cost: 75, description: 'Saves your streak if you miss a day.' },
        { id: 'xp_boost', emoji: '⚡', name: 'XP Boost Token (2x)', cost: 120, description: 'Doubles all XP earned from your next quiz.' }
    ]
};
