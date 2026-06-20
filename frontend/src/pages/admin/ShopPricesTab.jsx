import React, { useState, useEffect } from 'react';
import { Loader2, Save, RefreshCw } from 'lucide-react';
import api from '../../utils/api';

const PRICE_LABELS = {
    avatars:  { wizard_scholar: 'Wizard Scholar', cyber_learner: 'Cyber Learner', unicorn_scholar: 'Academic Unicorn' },
    titles:   { knowledge_alchemist: 'Alchemist of Knowledge', ultimate_mind: 'Ultimate Mind', legendary_scholar: 'Legendary Scholar' },
    themes:   { arcade: 'Retro Arcade', space: 'Space Nebula', cyberpunk: 'Neon Cyberpunk' },
    frames:   { bronze: 'Bronze Glow', silver: 'Silver Glow', gold: 'Gold Shine', diamond: 'Diamond Sparkle' },
    powerups: { streak_shield: 'Streak Shield', xp_boost: 'XP Boost Token', weekend_freeze: 'Weekend Freeze' },
};

const ShopPricesTab = () => {
    const [prices, setPrices] = useState(null);
    const [draft, setDraft] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        api.get('/api/admin/shop/prices')
            .then(res => { setPrices(res.data.prices); setDraft(structuredClone(res.data.prices)); })
            .finally(() => setLoading(false));
    }, []);

    const handleChange = (cat, key, val) => {
        setDraft(prev => ({ ...prev, [cat]: { ...prev[cat], [key]: parseInt(val) || 0 } }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.put('/api/admin/shop/prices', { prices: draft });
            setPrices(res.data.prices);
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => setDraft(structuredClone(prices));

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-white/40 text-sm py-8 justify-center">
                <Loader2 size={16} className="animate-spin" /> Loading…
            </div>
        );
    }

    return (
        <div className="space-y-5 max-w-xl">
            {Object.entries(draft ?? {}).map(([cat, items]) => (
                <div key={cat} className="bg-white dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] rounded-2xl p-5">
                    <h3 className="font-black text-slate-700 dark:text-white/60 text-xs uppercase tracking-widest mb-4 capitalize">{cat}</h3>
                    <div className="space-y-3">
                        {Object.entries(items).map(([key, val]) => (
                            <div key={key} className="flex items-center justify-between gap-4">
                                <label className="text-sm font-bold text-slate-700 dark:text-white/70 flex-1">
                                    {PRICE_LABELS[cat]?.[key] ?? key}
                                </label>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-amber-500 text-sm">🪙</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={val}
                                        onChange={e => handleChange(cat, key, e.target.value)}
                                        className="w-20 text-right px-2 py-1.5 text-sm font-black rounded-lg border border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <div className="flex items-center gap-3">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-black transition disabled:opacity-60"
                >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {saved ? '✓ Saved!' : 'Save Prices'}
                </button>
                <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200/60 dark:border-white/10 text-slate-500 dark:text-white/40 text-sm font-bold hover:bg-slate-100 dark:hover:bg-white/5 transition"
                >
                    <RefreshCw size={13} /> Reset
                </button>
            </div>
        </div>
    );
};

export default ShopPricesTab;
