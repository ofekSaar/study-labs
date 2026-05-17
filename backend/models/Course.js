import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimetype: { type: String, required: true },
  storagePath: { type: String, required: true },
  size: { type: Number, required: true },
}, { _id: false });

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    department: {
      type: String,
      required: true,
      enum: ['cs', 'math', 'physics', 'bio', 'other'],
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    color: {
      type: String,
      default: 'bg-studylabs-blue',
    },
    level: {
      type: String,
      default: 'Beginner',
      enum: ['Beginner', 'Intermediate', 'Advanced'],
    },
    syllabus: {
      type: fileSchema,
      required: true,
    },
    materials: [fileSchema],
    aiConfig: {
      nodeCount: {
        type: Number,
        default: 10,
        min: 5,
        max: 25,
      },
      quizFrequency: {
        type: Number,
        default: 3,
        min: 1,
        max: 5,
      },
    },
    gamification: {
      xpMultiplier: {
        type: Number,
        default: 1.0,
        min: 1.0,
        max: 2.0,
      },
      leaderboardEnabled: {
        type: Boolean,
        default: true,
      },
      bounties: {
        type: [{
          title: { type: String, required: true },
          description: { type: String, required: true },
          xpReward: { type: Number, default: 200 },
          targetNode: { type: String, default: "" },
          expiryDate: { type: Date, default: null },
          maxWinners: { type: Number, default: 5 },
          winners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        }],
        default: [],
      },
      customBadges: {
        type: [{
          title: { type: String, required: true },
          description: { type: String, required: true },
          xpReward: { type: Number, default: 300 },
          requirementType: { type: String, enum: ['quiz_streak', 'lessons_completed', 'custom'], default: 'custom' },
          requirementValue: { type: Number, default: 1 },
          iconName: { type: String, default: 'Award' },
        }],
        default: [],
      },
      rewardsStore: {
        type: [{
          title: { type: String, required: true },
          description: { type: String, required: true },
          xpCost: { type: Number, default: 1000 },
          type: { type: String, enum: ['academic', 'cosmetic', 'profile'], default: 'cosmetic' },
          unlockedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        }],
        default: [],
      },
    },
    generationStatus: {
      type: String,
      enum: ['pending', 'generating', 'ready', 'failed'],
      default: 'pending',
    },
    generationError: {
      type: String,
      default: null,
    },
    generationProgress: {
      type: String,
      default: 'Initializing AI Engine...',
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual to get node count
courseSchema.virtual('nodes', {
  ref: 'CourseNode',
  localField: '_id',
  foreignField: 'course',
});

// Index for instructor lookups
courseSchema.index({ instructor: 1 });
courseSchema.index({ isPublished: 1 });

const Course = mongoose.model('Course', courseSchema);

export default Course;
