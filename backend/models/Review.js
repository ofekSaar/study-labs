import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    student:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course:   { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    rating:   { type: Number, required: true, min: 1, max: 5 },
    comment:  { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

// One review per student per course
reviewSchema.index({ student: 1, course: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);
