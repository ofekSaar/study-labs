// ── Shop Item Rarity ─────────────────────────────────────────────────────────
export const RARITY = {
    common:    { label: 'Common',    color: '#94a3b8', bg: 'bg-slate-500/10',  border: 'border-slate-500/20',  text: 'text-slate-400'  },
    rare:      { label: 'Rare',      color: '#6366f1', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400' },
    epic:      { label: 'Epic',      color: '#a855f7', bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
    legendary: { label: 'Legendary', color: '#f59e0b', bg: 'bg-amber-500/10',  border: 'border-amber-500/20',  text: 'text-amber-400'  },
};

// ── Shop Category Filters ─────────────────────────────────────────────────────
export const SHOP_CATEGORIES = [
    { id: 'all',      label: 'All',       icon: '🛒'    },
    { id: 'avatars',  label: 'Avatars',   icon: '🧙‍♂️' },
    { id: 'titles',   label: 'Titles',    icon: '🌟'    },
    { id: 'themes',   label: 'Themes',    icon: '🌌'    },
    { id: 'frames',   label: 'Frames',    icon: '🖼️'   },
    { id: 'powerups', label: 'Power-ups', icon: '⚡'    },
    { id: 'history',  label: 'History',   icon: '🕐'    },
];

export const SHOP_CATEGORY_ACCENT = {
    avatars:  'indigo',
    titles:   'purple',
    themes:   'blue',
    frames:   'rose',
    powerups: 'amber',
};

// ── Level Milestone Roadmap ───────────────────────────────────────────────────
export const LEVEL_MILESTONES = [
    { level: 1, emoji: '🎓', avatar: 'Student',     title: 'Beginner',        desc: 'Initial Unlock'      },
    { level: 2, emoji: '📚', avatar: 'Scholar',     title: 'Curious Learner', desc: 'Bronze Milestone'    },
    { level: 3, emoji: '🧠', avatar: 'Brainiac',    title: 'Knowledge Seeker', desc: 'Silver Milestone'   },
    { level: 4, emoji: '⚡', avatar: 'Speed Demon', title: 'Speed Runner',    desc: 'Gold Milestone'      },
    { level: 5, emoji: '🥷', avatar: 'Code Ninja',  title: 'Code Ninja',      desc: 'Platinum Milestone'  },
    { level: 6, emoji: '🧙‍♂️', avatar: 'AI Sorcerer', title: 'AI Sorcerer',  desc: 'Emerald Milestone'   },
    { level: 8, emoji: '👑', avatar: 'Grandmaster', title: 'Grandmaster',     desc: 'Legendary Milestone' },
];

// ── XP-to-Level Formula ───────────────────────────────────────────────────────
export const XP_PER_LEVEL = 100;

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

export const FRAMES = [
    { id: 'default', name: 'No Frame', levelReq: 1 },
    { id: 'bronze', name: 'Bronze Glow', levelReq: 1 },
    { id: 'silver', name: 'Silver Glow', levelReq: 1 },
    { id: 'gold', name: 'Gold Shine', levelReq: 1 },
    { id: 'diamond', name: 'Diamond Sparkle', levelReq: 1 }
];

export const THEMES = [
    { id: 'default', name: 'Default Mode', levelReq: 1 },
    { id: 'arcade', name: 'Retro Arcade', levelReq: 1 },
    { id: 'space', name: 'Space Nebula', levelReq: 1 },
    { id: 'cyberpunk', name: 'Neon Cyberpunk', levelReq: 1 }
];

// rarity: 'common' | 'rare' | 'epic' | 'legendary'
// previewColors: accent colors used in the ItemPreviewModal
export const SHOP_ITEMS = {
    avatars: [
        { id: 'wizard_scholar', emoji: '🧙‍♂️', name: 'Wizard Scholar', cost: 150, description: 'A mystical master of educational wisdom.', rarity: 'rare', previewColors: ['#6366f1', '#8b5cf6'] },
        { id: 'cyber_learner', emoji: '👾', name: 'Cyber Learner', cost: 250, description: 'Direct neural interface to the study database.', rarity: 'epic', previewColors: ['#06b6d4', '#3b82f6'] },
        { id: 'unicorn_scholar', emoji: '🦄', name: 'Academic Unicorn', cost: 400, description: 'A rare creature of unparalleled brilliance.', rarity: 'legendary', previewColors: ['#ec4899', '#f59e0b'], isNew: true }
    ],
    titles: [
        { id: 'knowledge_alchemist', name: 'Alchemist of Knowledge', cost: 100, description: 'Transmuting study time into pure genius.', rarity: 'common', previewColors: ['#10b981', '#059669'] },
        { id: 'ultimate_mind', name: 'Ultimate Mind', cost: 200, description: 'Capable of storing infinite amounts of material.', rarity: 'rare', previewColors: ['#6366f1', '#8b5cf6'] },
        { id: 'legendary_scholar', name: 'Legendary Scholar', cost: 350, description: 'Your achievements will be spoken of for generations.', rarity: 'legendary', previewColors: ['#f59e0b', '#ef4444'] }
    ],
    themes: [
        { id: 'arcade', emoji: '🕹️', name: 'Retro Arcade Theme', cost: 200, description: 'Pixelated aesthetics and green phosphorescent fonts.', rarity: 'rare', previewColors: ['#10b981', '#065f46'], swatchColors: ['#0f172a', '#10b981', '#065f46', '#d1fae5'] },
        { id: 'space', emoji: '🌌', name: 'Space Nebula Theme', cost: 350, description: 'Deep space cosmic background with star constellations.', rarity: 'epic', previewColors: ['#6366f1', '#0f172a'], swatchColors: ['#0f172a', '#6366f1', '#8b5cf6', '#e0e7ff'] },
        { id: 'cyberpunk', emoji: '🤖', name: 'Neon Cyberpunk Theme', cost: 500, description: 'Cybernetic neon styles with glitch and sharp clip designs.', rarity: 'legendary', previewColors: ['#ec4899', '#0f172a'], swatchColors: ['#0f172a', '#ec4899', '#06b6d4', '#f0abfc'], isNew: true }
    ],
    frames: [
        { id: 'bronze', emoji: '🟫', name: 'Bronze Glow Frame', cost: 100, description: 'Covers your avatar in a warm bronze glow.', rarity: 'common', glowColor: '#92400e' },
        { id: 'silver', emoji: '⬜', name: 'Silver Glow Frame', cost: 180, description: 'Sleek silver futuristic border.', rarity: 'rare', glowColor: '#94a3b8' },
        { id: 'gold', emoji: '🟨', name: 'Gold Shine Frame', cost: 300, description: 'Bright glowing gold frame.', rarity: 'epic', glowColor: '#f59e0b' },
        { id: 'diamond', emoji: '💎', name: 'Diamond Sparkle Frame', cost: 500, description: 'Exclusive diamond border that sparkles and shifts colors.', rarity: 'legendary', glowColor: '#06b6d4', isNew: true }
    ],
    powerups: [
        { id: 'streak_shield', emoji: '🛡️', name: 'Streak Shield', cost: 75, description: 'Saves your streak if you miss a day.', rarity: 'common', previewColors: ['#10b981', '#065f46'], effect: 'Protects your daily study streak for 1 missed day.' },
        { id: 'xp_boost', emoji: '⚡', name: 'XP Boost Token (2x)', cost: 120, description: 'Doubles all XP earned from your next quiz.', rarity: 'rare', previewColors: ['#f59e0b', '#92400e'], effect: 'Doubles XP earned on your very next quiz submission.' },
        { id: 'weekend_freeze', emoji: '🥶', name: 'Weekend Freeze', cost: 150, description: 'Freezes your streak during the weekend.', rarity: 'rare', previewColors: ['#06b6d4', '#1e3a5f'], effect: 'Pauses streak decay on Saturday and Sunday.' }
    ]
};
