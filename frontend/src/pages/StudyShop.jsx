import React, { useState, useMemo } from 'react';
import StudentLayout from '../components/layout/StudentLayout';
import useGamificationStore from '../store/gamificationStore';
import { SHOP_ITEMS, RARITY, SHOP_CATEGORIES } from '../constants/gamification';
import { getDailyFeaturedItem } from '../utils/gamification';
import { Coins, ShoppingBag, Zap, HelpCircle, Clock, Star } from 'lucide-react';
import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import ConfettiEffect from '../components/gamification/ConfettiEffect';
import ItemPreviewModal from '../components/shop/ItemPreviewModal';
import { clickableProps } from '../utils/a11y';

// ── Sub-components ────────────────────────────────────────────────────────

const CoinDisplay = ({ coins }) => {
    const spring = useSpring(coins ?? 0, { stiffness: 80, damping: 18 });
    const display = useTransform(spring, (v) => Math.round(v).toLocaleString());
    React.useEffect(() => {
        spring.set(coins ?? 0);
    }, [coins]); // eslint-disable-line
    return <motion.span>{display}</motion.span>;
};

const RarityBadge = ({ rarity }) => {
    const r = RARITY[rarity] ?? RARITY.common;
    return (
        <span
            className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${r.bg} ${r.border} ${r.text}`}
        >
            {r.label}
        </span>
    );
};

const ItemCard = ({ item, category, isOwned, ownedCount, onPreview }) => {
    const r = RARITY[item.rarity] ?? RARITY.common;
    const isPowerup = category === 'powerups';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            {...clickableProps(() => onPreview(item, category), `Preview ${item.name}`)}
            className="group relative bg-white dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] rounded-2xl p-4 flex items-center justify-between gap-4 cursor-pointer hover:border-indigo-400/40 dark:hover:border-indigo-500/30 transition-all hover:shadow-lg"
            style={{ '--accent': r.color }}
        >
            {/* glow on hover */}
            <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ boxShadow: `inset 0 0 0 1px ${r.color}22` }}
            />

            <div className="flex items-center gap-3 min-w-0">
                {category === 'frames' ? (
                    <div className="w-14 h-14 shrink-0 flex items-center justify-center">
                        <div
                            className="w-11 h-11 rounded-full flex items-center justify-center text-xl border-2"
                            style={{
                                borderColor: item.glowColor ?? r.color,
                                boxShadow: `0 0 10px ${item.glowColor ?? r.color}99, 0 0 20px ${item.glowColor ?? r.color}44`,
                                background: `${item.glowColor ?? r.color}11`,
                            }}
                        >
                            🎓
                        </div>
                    </div>
                ) : item.emoji ? (
                    <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 border"
                        style={{
                            background: `${r.color}11`,
                            borderColor: `${r.color}33`,
                            boxShadow: `0 0 12px ${r.color}22`,
                        }}
                    >
                        {item.emoji}
                    </div>
                ) : (
                    <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-xs font-black shrink-0 border uppercase tracking-wider"
                        style={{
                            background: `${r.color}11`,
                            borderColor: `${r.color}33`,
                            color: r.color,
                        }}
                    >
                        {item.name.slice(0, 2)}
                    </div>
                )}
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <p className="font-black text-slate-800 dark:text-white text-sm truncate">
                            {item.name}
                        </p>
                        {item.isNew && (
                            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 shrink-0">
                                New
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <RarityBadge rarity={item.rarity} />
                        {isPowerup && ownedCount > 0 && (
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                ×{ownedCount}
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-white/35 mt-1 leading-snug line-clamp-1">
                        {item.description}
                    </p>
                </div>
            </div>

            <div className="shrink-0">
                {isOwned && !isPowerup ? (
                    <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl uppercase">
                        ✓ Owned
                    </span>
                ) : (
                    <div className="flex flex-col items-end gap-1">
                        <span className="font-black text-amber-500 text-sm flex items-center gap-1">
                            🪙 {item.cost}
                        </span>
                        <span className="text-[10px] text-white/30">tap to preview</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const FeaturedBanner = ({ item, coins, isOwned, onPreview }) => {
    const r = RARITY[item.rarity] ?? RARITY.legendary;

    return (
        <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-3xl overflow-hidden border cursor-pointer group"
            style={{
                borderColor: `${r.color}33`,
                background: `linear-gradient(135deg, ${r.color}11 0%, transparent 60%)`,
            }}
            {...clickableProps(
                () => onPreview(item, item.category),
                `Preview featured item ${item.name}`
            )}
        >
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: `radial-gradient(ellipse at 80% 50%, ${r.color}15 0%, transparent 70%)`,
                }}
            />
            <div className="relative z-10 p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {item.category === 'frames' ? (
                        <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2"
                                style={{
                                    borderColor: item.glowColor ?? r.color,
                                    boxShadow: `0 0 14px ${item.glowColor ?? r.color}aa, 0 0 28px ${item.glowColor ?? r.color}44`,
                                    background: `${item.glowColor ?? r.color}11`,
                                }}
                            >
                                🎓
                            </div>
                        </div>
                    ) : (
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border shrink-0"
                            style={{
                                background: `${r.color}15`,
                                borderColor: `${r.color}33`,
                                boxShadow: `0 0 24px ${r.color}33`,
                            }}
                        >
                            {item.emoji ?? '✨'}
                        </div>
                    )}
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                                ⭐ Deal of the Day
                            </span>
                            <RarityBadge rarity={item.rarity} />
                        </div>
                        <p className="font-black text-slate-800 dark:text-white text-lg leading-tight">
                            {item.name}
                        </p>
                        <p className="text-slate-500 dark:text-white/40 text-xs mt-0.5">
                            {item.description}
                        </p>
                    </div>
                </div>
                <div className="sm:text-right shrink-0">
                    {isOwned ? (
                        <span className="text-sm font-black text-emerald-400">✓ You own this</span>
                    ) : (
                        <>
                            <p className="font-black text-amber-400 text-xl">🪙 {item.cost}</p>
                            <button
                                className="mt-1.5 text-xs font-black px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition group-hover:scale-105"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onPreview(item, item.category);
                                }}
                                disabled={coins < item.cost}
                            >
                                {coins >= item.cost ? 'Preview & Buy' : 'Not enough coins'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const CategorySection = ({ categoryId, coins, unlocked, powerupCounts, onPreview }) => {
    const items =
        categoryId === 'all'
            ? [
                  ...SHOP_ITEMS.avatars.map((i) => ({ ...i, _cat: 'avatars' })),
                  ...SHOP_ITEMS.titles.map((i) => ({ ...i, _cat: 'titles' })),
                  ...SHOP_ITEMS.themes.map((i) => ({ ...i, _cat: 'themes' })),
                  ...SHOP_ITEMS.frames.map((i) => ({ ...i, _cat: 'frames' })),
                  ...SHOP_ITEMS.powerups.map((i) => ({ ...i, _cat: 'powerups' })),
              ]
            : SHOP_ITEMS[categoryId].map((i) => ({ ...i, _cat: categoryId }));

    return (
        <div>
            {categoryId === 'all' ? (
                Object.entries({
                    avatars: 'Avatars',
                    titles: 'Titles',
                    themes: 'Themes',
                    frames: 'Frames',
                    powerups: 'Power-ups',
                }).map(([cat, label]) => (
                    <div key={cat} className="mb-8">
                        <h3 className="font-black text-slate-700 dark:text-white/60 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                            {SHOP_CATEGORIES.find((c) => c.id === cat)?.icon} {label}
                        </h3>
                        <div className="space-y-3">
                            {SHOP_ITEMS[cat].map((item) => {
                                const isOwned = unlocked[cat]?.includes(item.id);
                                const ownedCount =
                                    cat === 'powerups' ? (powerupCounts[item.id] ?? 0) : 0;
                                return (
                                    <ItemCard
                                        key={item.id}
                                        item={item}
                                        category={cat}
                                        isOwned={isOwned}
                                        ownedCount={ownedCount}
                                        onPreview={onPreview}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))
            ) : (
                <div className="space-y-3">
                    {items.map((item) => {
                        const cat = item._cat;
                        const isOwned = unlocked[cat]?.includes(item.id);
                        const ownedCount = cat === 'powerups' ? (powerupCounts[item.id] ?? 0) : 0;
                        return (
                            <ItemCard
                                key={item.id}
                                item={item}
                                category={cat}
                                coins={coins}
                                isOwned={isOwned}
                                ownedCount={ownedCount}
                                onPreview={onPreview}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const CATEGORY_ICONS = { avatars: '🧙‍♂️', titles: '🌟', themes: '🌌', frames: '🖼️', powerups: '⚡' };

const PurchaseHistory = ({ history }) => {
    if (!history || history.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-4xl mb-3">🛒</span>
                <p className="text-slate-500 dark:text-white/40 text-sm">No purchases yet.</p>
                <p className="text-slate-400 dark:text-white/25 text-xs mt-1">
                    Items you buy will appear here.
                </p>
            </div>
        );
    }
    return (
        <div className="space-y-3">
            {history.map((entry, i) => {
                const allItems = SHOP_ITEMS[entry.category] ?? [];
                const item = allItems.find((x) => x.id === entry.itemId);
                return (
                    <div
                        key={i}
                        className="flex items-center justify-between gap-4 bg-white dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] rounded-2xl p-4"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">
                                {item?.emoji ?? CATEGORY_ICONS[entry.category] ?? '📦'}
                            </span>
                            <div>
                                <p className="font-black text-slate-800 dark:text-white text-sm">
                                    {item?.name ?? entry.itemId}
                                </p>
                                <p className="text-xs text-slate-400 dark:text-white/35 capitalize">
                                    {entry.category}
                                </p>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="font-black text-amber-500 text-sm">🪙 {entry.cost}</p>
                            <p className="text-[10px] text-slate-400 dark:text-white/30">
                                {entry.purchasedAt
                                    ? new Date(entry.purchasedAt).toLocaleDateString()
                                    : ''}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// ── Main Page ─────────────────────────────────────────────────────────────

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
        purchaseHistory,
        buyItem,
    } = useGamificationStore();

    const [activeTab, setActiveTab] = useState('all');
    const [previewItem, setPreviewItem] = useState(null);
    const [previewCategory, setPreviewCategory] = useState(null);

    const featured = useMemo(() => getDailyFeaturedItem(), []);

    const unlocked = {
        avatars: unlockedAvatars,
        titles: unlockedTitles,
        themes: unlockedThemes,
        frames: unlockedFrames,
        powerups: [],
    };

    const powerupCounts = {
        streak_shield: streakShields,
        xp_boost: xpBoosts,
        weekend_freeze: weekendFreezes,
    };

    const isFeaturedOwned = unlocked[featured.category]?.includes(featured.id);

    const openPreview = (item, category) => {
        setPreviewItem(item);
        setPreviewCategory(category);
    };
    const closePreview = () => {
        setPreviewItem(null);
        setPreviewCategory(null);
    };

    return (
        <StudentLayout title="Study Shop">
            <ConfettiEffect />

            {previewItem && (
                <ItemPreviewModal
                    item={previewItem}
                    category={previewCategory}
                    coins={coins}
                    isOwned={
                        previewCategory === 'powerups'
                            ? false
                            : unlocked[previewCategory]?.includes(previewItem.id)
                    }
                    onBuy={buyItem}
                    onClose={closePreview}
                />
            )}

            <div className="max-w-3xl mx-auto px-4 py-6 pb-24 space-y-6">
                {/* ── Banner ── */}
                <motion.div
                    initial={{ y: -16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 border border-indigo-500/20 p-6 sm:p-8 shadow-[0_10px_30px_rgba(99,102,241,0.15)]"
                >
                    <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-56 h-56 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                        <div className="space-y-1.5">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-black uppercase tracking-wider">
                                <ShoppingBag size={11} /> Gamified Economy
                            </div>
                            <h1 className="text-3xl font-display font-black text-white leading-tight">
                                Study Shop
                            </h1>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                                Spend your Study Coins on avatars, titles, themes, frames, and
                                power-ups.
                            </p>
                        </div>
                        <motion.div
                            whileHover={{ scale: 1.04 }}
                            className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-6 py-4 flex items-center gap-3 sm:w-52 justify-center shrink-0"
                        >
                            <span className="text-3xl animate-bounce select-none">🪙</span>
                            <div>
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none">
                                    Balance
                                </p>
                                <p className="text-2xl font-black text-amber-400 mt-1 font-display">
                                    <CoinDisplay coins={coins} />
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>

                {/* ── Featured Deal ── */}
                <FeaturedBanner
                    item={featured}
                    coins={coins}
                    isOwned={isFeaturedOwned}
                    onPreview={openPreview}
                />

                {/* ── Category Tabs ── */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {SHOP_CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveTab(cat.id)}
                            className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                                activeTab === cat.id
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                                    : 'bg-white dark:bg-white/5 border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-white/50 hover:border-indigo-500/30 hover:text-indigo-600 dark:hover:text-white'
                            }`}
                        >
                            <span>{cat.icon}</span> {cat.label}
                            {cat.id === 'history' && purchaseHistory?.length > 0 && (
                                <span className="ml-0.5 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[9px] flex items-center justify-center font-black">
                                    {purchaseHistory.length > 9 ? '9+' : purchaseHistory.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── Content ── */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                    >
                        {activeTab === 'history' ? (
                            <PurchaseHistory history={purchaseHistory} />
                        ) : (
                            <CategorySection
                                categoryId={activeTab}
                                coins={coins}
                                unlocked={unlocked}
                                powerupCounts={powerupCounts}
                                onPreview={openPreview}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* ── How to Earn ── */}
                {activeTab !== 'history' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none" />
                        <h3 className="font-display font-black text-lg text-slate-800 dark:text-white flex items-center gap-2 mb-4 relative z-10">
                            <HelpCircle size={18} className="text-emerald-500" />
                            How to Earn Coins
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
                            {[
                                {
                                    icon: <Zap size={18} />,
                                    color: 'emerald',
                                    title: 'Correct Answers',
                                    body: 'Each correct quiz answer earns XP, which converts 1:1 to coins. Perfect scores give a bonus!',
                                },
                                {
                                    icon: '🔥',
                                    color: 'orange',
                                    title: 'Daily Streak',
                                    body: 'Keeping a study streak applies an XP multiplier — the longer your streak, the more coins per quiz.',
                                },
                                {
                                    icon: '👑',
                                    color: 'purple',
                                    title: 'Quests & Challenges',
                                    body: 'Complete daily challenges and quests in your Dashboard for instant coin bundles.',
                                },
                            ].map(({ icon, color, title, body }) => (
                                <div
                                    key={title}
                                    className="bg-slate-50/50 dark:bg-black/20 rounded-2xl p-4 border border-slate-200/40 dark:border-white/5"
                                >
                                    <div
                                        className={`w-9 h-9 rounded-xl bg-${color}-500/10 text-${color}-500 flex items-center justify-center mb-2.5`}
                                    >
                                        {typeof icon === 'string' ? <span>{icon}</span> : icon}
                                    </div>
                                    <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">
                                        {title}
                                    </h4>
                                    <p className="text-slate-500 dark:text-white/40 text-xs leading-relaxed">
                                        {body}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>
        </StudentLayout>
    );
};

export default StudyShop;
