import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

const RARITY_LABELS = {
    common: { label: 'Common', color: '#94a3b8' },
    rare: { label: 'Rare', color: '#6366f1' },
    epic: { label: 'Epic', color: '#a855f7' },
    legendary: { label: 'Legendary', color: '#f59e0b' },
};

const AvatarPreview = ({ item, coins, isOwned, onBuy, buying }) => (
    <div className="flex flex-col items-center gap-6">
        <div
            className="w-32 h-32 rounded-3xl flex items-center justify-center text-6xl shadow-2xl border-2"
            style={{
                background: `linear-gradient(135deg, ${item.previewColors?.[0] ?? '#6366f1'}22, ${item.previewColors?.[1] ?? '#8b5cf6'}22)`,
                borderColor: item.previewColors?.[0] ?? '#6366f1',
                boxShadow: `0 0 32px ${item.previewColors?.[0] ?? '#6366f1'}44`,
            }}
        >
            {item.emoji}
        </div>
        <div className="text-center">
            <p className="text-slate-400 dark:text-white/50 text-xs">Preview on leaderboard</p>
            <div className="mt-3 bg-white/5 border border-white/10 rounded-2xl px-6 py-3 inline-flex items-center gap-3">
                <span className="text-3xl">{item.emoji}</span>
                <div className="text-left">
                    <p className="text-sm font-black text-white">Sample User</p>
                    <p className="text-xs text-white/40">Level 5 · 3,200 XP</p>
                </div>
            </div>
        </div>
        <BuyOrOwned item={item} coins={coins} isOwned={isOwned} onBuy={onBuy} buying={buying} />
    </div>
);

const TitlePreview = ({ item, coins, isOwned, onBuy, buying }) => (
    <div className="flex flex-col items-center gap-6">
        <div className="text-center space-y-2">
            <p className="text-slate-400 dark:text-white/50 text-xs">Preview under your name</p>
            <div className="mt-4 inline-flex flex-col items-center gap-1 bg-white/5 border border-white/10 rounded-2xl px-8 py-5">
                <span className="text-3xl">🎓</span>
                <p className="font-black text-white text-lg">Sample User</p>
                <p
                    className="text-sm font-bold uppercase tracking-widest"
                    style={{ color: item.previewColors?.[0] ?? '#6366f1' }}
                >
                    {item.name}
                </p>
            </div>
        </div>
        <BuyOrOwned item={item} coins={coins} isOwned={isOwned} onBuy={onBuy} buying={buying} />
    </div>
);

const ThemePreview = ({ item, coins, isOwned, onBuy, buying }) => (
    <div className="flex flex-col items-center gap-6">
        <div className="text-center space-y-2">
            <p className="text-slate-400 dark:text-white/50 text-xs">Color palette</p>
            <div className="flex gap-2 mt-3 justify-center">
                {(item.swatchColors ?? [item.previewColors?.[0], item.previewColors?.[1], '#ffffff22', '#00000022']).map((c, i) => (
                    <div
                        key={i}
                        className="w-10 h-10 rounded-xl border border-white/10 shadow"
                        style={{ background: c }}
                    />
                ))}
            </div>
        </div>
        <div
            className="w-full rounded-2xl p-5 border border-white/10 text-sm space-y-2"
            style={{ background: `linear-gradient(135deg, ${item.previewColors?.[0] ?? '#6366f1'}33, ${item.previewColors?.[1] ?? '#0f172a'})` }}
        >
            <div className="flex items-center gap-2">
                <span className="text-2xl">{item.emoji}</span>
                <span className="font-black text-white">{item.name}</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full w-2/3 rounded-full" style={{ background: item.previewColors?.[0] ?? '#6366f1' }} />
            </div>
            <p className="text-white/50 text-xs">{item.description}</p>
        </div>
        <BuyOrOwned item={item} coins={coins} isOwned={isOwned} onBuy={onBuy} buying={buying} />
    </div>
);

const FramePreview = ({ item, coins, isOwned, onBuy, buying }) => (
    <div className="flex flex-col items-center gap-6">
        <div className="relative">
            <div
                className="w-28 h-28 rounded-full flex items-center justify-center text-5xl border-4"
                style={{
                    borderColor: item.glowColor ?? '#6366f1',
                    boxShadow: `0 0 20px ${item.glowColor ?? '#6366f1'}88, 0 0 40px ${item.glowColor ?? '#6366f1'}44`,
                }}
            >
                🎓
            </div>
        </div>
        <p className="text-slate-400 dark:text-white/50 text-xs text-center">{item.description}</p>
        <BuyOrOwned item={item} coins={coins} isOwned={isOwned} onBuy={onBuy} buying={buying} />
    </div>
);

const PowerupPreview = ({ item, coins, isOwned, onBuy, buying }) => (
    <div className="flex flex-col items-center gap-6">
        <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl border-2"
            style={{
                background: `linear-gradient(135deg, ${item.previewColors?.[0] ?? '#6366f1'}22, ${item.previewColors?.[1] ?? '#8b5cf6'}22)`,
                borderColor: item.previewColors?.[0] ?? '#6366f1',
            }}
        >
            {item.emoji}
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 w-full text-sm">
            <p className="font-black text-white mb-1">Effect</p>
            <p className="text-white/60 leading-relaxed">{item.effect ?? item.description}</p>
        </div>
        <p className="text-white/40 text-xs">Stackable — you can own multiple.</p>
        <BuyOrOwned item={item} coins={coins} isOwned={isOwned} onBuy={onBuy} buying={buying} />
    </div>
);

const BuyOrOwned = ({ item, coins, isOwned, onBuy, buying }) => {
    const canAfford = (coins ?? 0) >= item.cost;
    if (isOwned) {
        return (
            <span className="px-6 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-sm uppercase tracking-wider">
                ✓ Already Owned
            </span>
        );
    }
    return (
        <button
            onClick={onBuy}
            disabled={!canAfford || buying}
            className={`px-8 py-3 rounded-xl font-black text-sm flex items-center gap-2 transition-all ${
                canAfford && !buying
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-95'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
            }`}
        >
            {buying ? <Loader2 size={16} className="animate-spin" /> : <><span>🪙</span>{item.cost} Coins — Buy Now</>}
        </button>
    );
};

const PREVIEW_BY_CATEGORY = {
    avatars: AvatarPreview,
    titles: TitlePreview,
    themes: ThemePreview,
    frames: FramePreview,
    powerups: PowerupPreview,
};

const ItemPreviewModal = ({ item, category, coins, isOwned, onBuy, onClose }) => {
    const [buying, setBuying] = useState(false);
    const rarity = RARITY_LABELS[item.rarity] ?? RARITY_LABELS.common;
    const PreviewComponent = PREVIEW_BY_CATEGORY[category] ?? AvatarPreview;

    const handleBuy = async () => {
        if (buying) return;
        setBuying(true);
        try {
            const ok = await onBuy(category, item.id, item.cost);
            if (ok) onClose();
        } finally {
            setBuying(false);
        }
    };

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.92, opacity: 0, y: 16 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.92, opacity: 0, y: 16 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-7 shadow-2xl"
                    onClick={e => e.stopPropagation()}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition"
                    >
                        <X size={16} />
                    </button>

                    <div className="mb-5">
                        <div className="flex items-center gap-2 mb-1">
                            <span
                                className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border"
                                style={{ color: rarity.color, borderColor: `${rarity.color}44`, background: `${rarity.color}11` }}
                            >
                                {rarity.label}
                            </span>
                            {item.isNew && (
                                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border text-emerald-400 border-emerald-400/30 bg-emerald-400/10">
                                    New
                                </span>
                            )}
                        </div>
                        <h3 className="text-xl font-black text-white">{item.name}</h3>
                        <p className="text-white/50 text-xs mt-0.5">{item.description}</p>
                    </div>

                    <PreviewComponent
                        item={item}
                        coins={coins}
                        isOwned={isOwned}
                        onBuy={handleBuy}
                        buying={buying}
                    />
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
};

export default ItemPreviewModal;
