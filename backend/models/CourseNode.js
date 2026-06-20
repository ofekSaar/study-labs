import mongoose from 'mongoose';

const quizQuestionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['mcq', 'open', 'summary'],
  },
  question: {
    type: String,
    required: true,
  },
  options: {
    type: [String],
    default: undefined, // MCQ only
  },
  correctAnswerIndex: {
    type: Number,
    default: undefined, // MCQ only
  },
  explanation: {
    type: String,
    default: null,
  },
  content: {
    type: String,
    default: null, // Summary only
  },
  minLength: {
    type: Number,
    default: null, // Open only
  },
  aiPromptContext: {
    type: String,
    default: null, // Open only
  },
}, { _id: false });

const courseNodeSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    type: {
      type: String,
      required: true,
      enum: ['lesson', 'quiz', 'project', 'challenge', 'exam'],
    },
    order: {
      type: Number,
      required: true,
    },
    estimatedMinutes: {
      type: Number,
      default: 45,
    },
    xpReward: {
      type: Number,
      default: 150,
    },
    // ── Lesson Content (Markdown) ──────────────────────
    lessonContent: {
      type: String,
      default: null,
      // Raw markdown string for lesson-type nodes
    },
    lessonContentPath: {
      type: String,
      default: null,
      // Storage path to the .md file in the storage layer
    },
    // ── Quiz Data ──────────────────────────────────────
    quizData: {
      type: [quizQuestionSchema],
      default: undefined,
    },
    isMaterialGrounded: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for ordering within a course
courseNodeSchema.index({ course: 1, order: 1 });

const CourseNode = mongoose.model('CourseNode', courseNodeSchema);

export default CourseNode;
