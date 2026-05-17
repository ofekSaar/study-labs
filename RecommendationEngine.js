// Import required libraries
import { getRecommendations } from './recommendation-calculator';

class RecommendationEngine {
  constructor() {}

  // Method to provide AI-powered recommendations for a student
  getRecommendations(studentData) {
    const recommendations = getRecommendations(studentData);
    return recommendations;
  }
}

export default RecommendationEngine;