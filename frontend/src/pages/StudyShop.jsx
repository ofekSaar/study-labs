import React, { useState } from 'react';
import StudentLayout from '../components/layout/StudentLayout';
import useGamificationStore from '../store/gamificationStore';
import { SHOP_ITEMS } from '../constants/gamification';
import { Coins, ShoppingBag, Lock, Check, Sparkles, HelpCircle, Zap, Shield, Loader2 } from 'lucide-react';
import { motion, useSpring, useTransform } from 'framer-motion';
import ConfettiEffect from '../components/gamification/ConfettiEffect';

// Animated coin counter — springs to the new value whenever `coins` changes
const CoinDisplay = ({ coins }) => {
    const spring = useSpring(coins ?? 0, { stiffness: 80, damping: 18 });
    const display = useTransform(spring, v => Math.round(v).toLocaleString());
    React.useEffect(() => { spring.set(coins ?? 0); }, [coins]); // eslint-disable-line
    return <motion.span>{display}</motion.span>;
};

// Shared buy button — handles disabled state + per-item loading spinner
const BuyButton = ({ item, category, coins, buyItem }) => {
    const [buying, setBuying] = useState(false);
    const canAfford = (coins ?? 0) >= item.cost;

    const handleBuy = async () => {
        if (!canAfford || buying) return;
        setBuying(true);
        try { await buyItem(category, item.id, item.cost); } finally { setBuying(false); }
    };

    return (
        <button
            onClick={handleBuy}
            disabled={!canAfford || buying}
            aria-label={canAfford ? `Buy ${item.name} for ${item.cost} coins` : `Not enough coins for ${item.name}`}
            className={`font-black text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition shadow-sm shrink-0 min-w-[72px] justify-center
                ${canAfford && !buying
                    ? 'bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 cursor-pointer'
                    : 'bg-slate-200 dark:bg-white/10 text-slate-400 dark:text-white/30 cursor-not-allowed opacity-60'
                }`}
        >
            {buying
                ? <Loader2 size={14} className="animate-spin" />
                : <><span>🪙</span> {item.cost}</>
            }
        </button>
    );
};

// Shared "Owned" badge
const OwnedBadge = () => (
    <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl uppercase shrink-0">
        Owned
    </span>
);

const StudyShop = () => {
    const {
        coins,
        unlockedAvatars,
        unlockedTitles,
        unlockedThemes,
        unlockedFrames,
        streakShields,
        xpBoosts,
        weekendFreezes,
        buyItem
    } = useGamificationStore();

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };
    const itemVariants = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

    return (
        <StudentLayout title="Study Shop">
            <ConfettiEffect />
            <div className="max-w-6xl mx-auto px-4 py-4 sm:py-8 space-y-8 pb-24">

                {/* ── Shop Banner & Coin Balance ── */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 border border-indigo-500/20 p-5 sm:p-8 md:p-10 shadow-[0_10px_30px_rgba(99,102,241,0.15)]"
                >
                    <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2 max-w-xl">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-black uppercase tracking-wider">
                                <Sparkles size={12} /> Gamified Economy
                            </div>
                            <h1 className="text-3xl md:text-4xl font-display font-black text-white leading-tight">
                                Welcome to the Study Shop
                            </h1>
                            <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                                Spend your earned Study Coins to customize your avatar, unlock prestige titles, and activate power-ups. Answering questions correctly in quizzes awards you coins!
                            </p>
                        </div>

                        {/* Animated coin balance */}
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 flex items-center gap-4 shadow-[inset_0_2px_4px_rgba(245,158,11,0.05)] md:w-72 justify-center"
                        >
                            <span className="text-4xl select-none animate-bounce">🪙</span>
                            <div>
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none">Your Balance</p>
                                <p className="text-3xl font-black text-amber-400 mt-1.5 font-display">
                                    <CoinDisplay coins={coins} /> Coins
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>

                {/* ── Shop Grid ── */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    {/* Category 1: Avatars */}
                    <motion.div variants={itemVariants}
                        className="bg-white/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-md relative overflow-hidden flex flex-col"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
                        <h3 className="font-display font-black text-xl text-slate-800 dark:text-white flex items-center gap-2 mb-2 relative z-10">
                            🧙‍♂️ Premium Avatars
                        </h3>
                        <p className="text-slate-500 dark:text-white/50 text-xs mb-6 relative z-10">
                            Unlock unique emoji avatars to show off on the leaderboards.
                        </p>
                        <div className="space-y-4 flex-1 relative z-10">
                            {SHOP_ITEMS.avatars.map(item => {
                                const isOwned = unlockedAvatars.includes(item.id);
                                return (
                                    <div key={item.id}
                                        className="bg-white dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4 transition hover:border-indigo-500/30"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl select-none bg-slate-100 dark:bg-white/5 w-14 h-14 rounded-xl flex items-center justify-center border border-slate-200/30 dark:border-white/5">{item.emoji}</span>
                                            <div>
                                                <p className="font-black text-slate-800 dark:text-white text-sm">{item.name}</p>
                                                <p className="text-[10px] text-slate-400 dark:text-white/40 mt-1 leading-snug">{item.description}</p>
                                            </div>
                                        </div>
                                        {isOwned ? <OwnedBadge /> : <BuyButton item={item} category="avatars" coins={coins} buyItem={buyItem} />}
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Category 2: Custom Titles */}
                    <motion.div variants={itemVariants}
                        className="bg-white/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-md relative overflow-hidden flex flex-col"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />
                        <h3 className="font-display font-black text-xl text-slate-800 dark:text-white flex items-center gap-2 mb-2 relative z-10">
                            🌟 Custom Titles
                        </h3>
                        <p className="text-slate-500 dark:text-white/50 text-xs mb-6 relative z-10">
                            Prestige titles to wear below your name on your profile.
                        </p>
                        <div className="space-y-4 flex-1 relative z-10">
                            {SHOP_ITEMS.titles.map(item => {
                                const isOwned = unlockedTitles.includes(item.id);
                                return (
                                    <div key={item.id}
                                        className="bg-white dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4 transition hover:border-indigo-500/30"
                                    >
                                        <div>
                                            <p className="font-black text-slate-800 dark:text-white text-sm uppercase tracking-wider">{item.name}</p>
                                            <p className="text-[10px] text-slate-400 dark:text-white/40 mt-1 leading-snug">{item.description}</p>
                                        </div>
                                        {isOwned ? <OwnedBadge /> : <BuyButton item={item} category="titles" coins={coins} buyItem={buyItem} />}
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Category 3: UI Themes */}
                    <motion.div variants={itemVariants}
                        className="bg-white/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-md relative overflow-hidden flex flex-col"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
                        <h3 className="font-display font-black text-xl text-slate-800 dark:text-white flex items-center gap-2 mb-2 relative z-10">
                            🌌 UI Themes
                        </h3>
                        <p className="text-slate-500 dark:text-white/50 text-xs mb-6 relative z-10">
                            Unlock unique UI skins to change your entire dashboard look.
                        </p>
                        <div className="space-y-4 flex-1 relative z-10">
                            {SHOP_ITEMS.themes.map(item => {
                                const isOwned = unlockedThemes.includes(item.id);
                                return (
                                    <div key={item.id}
                                        className="bg-white dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4 transition hover:border-indigo-500/30"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="text-2xl select-none bg-slate-100 dark:bg-white/5 w-12 h-12 rounded-xl flex items-center justify-center border border-slate-200/30 dark:border-white/5">{item.emoji}</span>
                                            <div className="min-w-0">
                                                <p className="font-black text-slate-800 dark:text-white text-sm truncate">{item.name}</p>
                                                <p className="text-[10px] text-slate-400 dark:text-white/40 mt-1 leading-snug">{item.description}</p>
                                            </div>
                                        </div>
                                        {isOwned ? <OwnedBadge /> : <BuyButton item={item} category="themes" coins={coins} buyItem={buyItem} />}
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Category 4: Glowing Borders */}
                    <motion.div variants={itemVariants}
                        className="bg-white/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-md relative overflow-hidden flex flex-col"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-rose-500/5 to-transparent pointer-events-none" />
                        <h3 className="font-display font-black text-xl text-slate-800 dark:text-white flex items-center gap-2 mb-2 relative z-10">
                            🖼️ Glowing Borders
                        </h3>
                        <p className="text-slate-500 dark:text-white/50 text-xs mb-6 relative z-10">
                            Equip legendary glowing borders around your avatar.
                        </p>
                        <div className="space-y-4 flex-1 relative z-10">
                            {SHOP_ITEMS.frames.map(item => {
                                const isOwned = unlockedFrames.includes(item.id);
                                return (
                                    <div key={item.id}
                                        className="bg-white dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4 transition hover:border-indigo-500/30"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="text-2xl select-none bg-slate-100 dark:bg-white/5 w-12 h-12 rounded-xl flex items-center justify-center border border-slate-200/30 dark:border-white/5">{item.emoji}</span>
                                            <div className="min-w-0">
                                                <p className="font-black text-slate-800 dark:text-white text-sm truncate">{item.name}</p>
                                                <p className="text-[10px] text-slate-400 dark:text-white/40 mt-1 leading-snug">{item.description}</p>
                                            </div>
                                        </div>
                                        {isOwned ? <OwnedBadge /> : <BuyButton item={item} category="frames" coins={coins} buyItem={buyItem} />}
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* Category 5: Power-ups (stackable — always purchasable if affordable) */}
                    <motion.div variants={itemVariants}
                        className="bg-white/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-md relative overflow-hidden flex flex-col"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
                        <h3 className="font-display font-black text-xl text-slate-800 dark:text-white flex items-center gap-2 mb-2 relative z-10">
                            ⚡ Boosters & Powerups
                        </h3>
                        <p className="text-slate-500 dark:text-white/50 text-xs mb-6 relative z-10">
                            Equip items that help preserve your streaks or multiply earned XP.
                        </p>
                        <div className="space-y-4 flex-1 relative z-10">
                            {SHOP_ITEMS.powerups.map(item => {
                                const ownedCount = item.id === 'streak_shield' ? streakShields : (item.id === 'xp_boost' ? xpBoosts : weekendFreezes);
                                return (
                                    <div key={item.id}
                                        className="bg-white dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4 transition hover:border-indigo-500/30"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl select-none bg-slate-100 dark:bg-white/5 w-14 h-14 rounded-xl flex items-center justify-center border border-slate-200/30 dark:border-white/5">{item.emoji}</span>
                                            <div>
                                                <p className="font-black text-slate-800 dark:text-white text-sm">
                                                    {item.name}
                                                    {ownedCount > 0 && (
                                                        <span className="ml-2 px-1.5 py-0.5 bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-md text-[10px] font-black">x{ownedCount}</span>
                                                    )}
                                                </p>
                                                <p className="text-[10px] text-slate-400 dark:text-white/40 mt-1 leading-snug">{item.description}</p>
                                            </div>
                                        </div>
                                        <BuyButton item={item} category="powerups" coins={coins} buyItem={buyItem} />
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>

                </motion.div>

                {/* ── How to earn points & coins ── */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-md relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none" />
                    <h3 className="font-display font-black text-xl text-slate-800 dark:text-white flex items-center gap-2 mb-4 relative z-10">
                        <HelpCircle className="text-emerald-500" />
                        How to Earn Points & Coins?
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                        <div className="bg-slate-50/50 dark:bg-black/25 rounded-2xl p-4 border border-slate-200/50 dark:border-white/5">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black mb-3">
                                <Zap size={20} />
                            </div>
                            <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">Answer Questions Correctly</h4>
                            <p className="text-slate-500 dark:text-white/40 text-xs leading-relaxed">Each correct answer in a quiz awards you XP. Perfect scores give a massive bonus, and all earned XP matches with equivalent Coins! 🪙</p>
                        </div>
                        <div className="bg-slate-50/50 dark:bg-black/25 rounded-2xl p-4 border border-slate-200/50 dark:border-white/5">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-black mb-3">🔥</div>
                            <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">Keep a Streak Going</h4>
                            <p className="text-slate-500 dark:text-white/40 text-xs leading-relaxed">Completing study activities daily increases your streak multiplier. Higher streaks award multiplier boosts to all quiz XP earnings!</p>
                        </div>
                        <div className="bg-slate-50/50 dark:bg-black/25 rounded-2xl p-4 border border-slate-200/50 dark:border-white/5">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black mb-3">👑</div>
                            <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">Daily Challenges & Quests</h4>
                            <p className="text-slate-500 dark:text-white/40 text-xs leading-relaxed">Complete daily tasks or long-term quests in your dashboard to earn instant heavy coin bundles and level-up rewards.</p>
                        </div>
                    </div>
                </motion.div>

            </div>
        </StudentLayout>
    );
};

export default StudyShop;
