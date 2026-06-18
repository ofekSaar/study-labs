import mongoose from 'mongoose';

const systemConfigSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);

export const DEFAULT_SHOP_PRICES = {
  avatars: {
    wizard_scholar: 150,
    cyber_learner: 250,
    unicorn_scholar: 400,
  },
  titles: {
    knowledge_alchemist: 100,
    ultimate_mind: 200,
    legendary_scholar: 350,
  },
  themes: {
    arcade: 200,
    space: 350,
    cyberpunk: 500,
  },
  frames: {
    bronze: 100,
    silver: 180,
    gold: 300,
    diamond: 500,
  },
  powerups: {
    streak_shield: 75,
    xp_boost: 120,
    weekend_freeze: 150,
  },
};

export async function seedShopPrices() {
  await SystemConfig.findOneAndUpdate(
    { key: 'shopPrices' },
    { $setOnInsert: { key: 'shopPrices', value: DEFAULT_SHOP_PRICES } },
    { upsert: true, new: true }
  );
}

export default SystemConfig;
