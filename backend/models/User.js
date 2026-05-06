import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      required: true,
      enum: ['google', 'github', 'facebook', 'local'],
    },
    providerId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    roles: {
      type: [String],
      enum: ['student', 'instructor'],
      default: [],
    },
    // Keep for backward compatibility, maps to primary role
    role: {
      type: String,
      enum: ['student', 'instructor', null],
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for provider lookups
userSchema.index({ provider: 1, providerId: 1 }, { unique: true });

// Don't return sensitive fields in JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;
