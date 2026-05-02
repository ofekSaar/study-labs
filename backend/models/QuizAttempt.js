import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionIndex: {
    type: Number,
    required: true,
  },
  selectedOption: {
    type: Number,
    default: null, // MCQ
  },
  openAnswer: {
    type: String,
    default: null, // Open question
  },
  isCorrect: {
    type: Boolean,
    required: true,
  },
}, { _id: false });

const quizAttemptSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    courseNode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CourseNode',
      required: true,
    },
    answers: [answerSchema],
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    xpEarned: {
      type: Number,
      required: true,
      default: 0,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying student attempts per node
quizAttemptSchema.index({ student: 1, courseNode: 1 });

const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);

export default QuizAttempt;
