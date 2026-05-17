// Import required libraries
import { Engine } from './engine';
import { RecommendationEngine } from './recommendation-engine';
import { GamifiedProgressTracker } from './gamified-progress-tracker';

class SyllabusRagEngine {
  constructor() {
    this.engine = new Engine();
    this.recommendationEngine = new RecommendationEngine();
    this.progressTracker = new GamifiedProgressTracker();
  }

  // Method to calculate RAG (Red, Amber, Green) status for a syllabus
  calculateRagStatus(syllabusData) {
    const ragStatus = this.engine.calculateRagStatus(syllabusData);
    return ragStatus;
  }

  // Method to provide AI-powered recommendations for a student
  getRecommendations(studentData) {
    const recommendations = this.recommendationEngine.getRecommendations(studentData);
    return recommendations;
  }

  // Method to track progress and reward points to students
  trackProgress(studentData, syllabusData) {
    const progressPoints = this.progressTracker.trackProgress(studentData, syllabusData);
    return progressPoints;
  }
}

export default SyllabusRagEngine;