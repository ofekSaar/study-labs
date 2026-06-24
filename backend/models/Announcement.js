import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Announcement', announcementSchema);
