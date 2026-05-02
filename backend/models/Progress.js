import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    completedNodes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CourseNode',
      },
    ],
    currentNode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CourseNode',
      default: null,
    },
    totalXP: {
      type: Number,
      default: 0,
    },
    streak: {
      type: Number,
      default: 0,
    },
    lastActivityDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// One progress record per student per course
progressSchema.index({ student: 1, course: 1 }, { unique: true });

/**
 * Updates the streak based on last activity date.
 * Called before saving to maintain streak consistency.
 */
progressSchema.methods.updateStreak = function () {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (!this.lastActivityDate) {
    this.streak = 1;
  } else {
    const lastDate = new Date(this.lastActivityDate);
    const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
    const diffDays = Math.floor((today - lastDay) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Same day — no change
    } else if (diffDays === 1) {
      // Consecutive day — increment
      this.streak += 1;
    } else {
      // Streak broken — reset
      this.streak = 1;
    }
  }

  this.lastActivityDate = now;
};

const Progress = mongoose.model('Progress', progressSchema);

export default Progress;
