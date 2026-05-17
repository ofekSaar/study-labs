// Import required libraries
import { trackProgress } from './progress-tracker';

class GamifiedProgressTracker {
  constructor() {}

  // Method to track progress and reward points to students
  trackProgress(studentData, syllabusData) {
    const progressPoints = trackProgress(studentData, syllabusData);
    return progressPoints;
  }
}

export default GamifiedProgressTracker;