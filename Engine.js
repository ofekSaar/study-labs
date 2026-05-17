// Import required libraries
import { calculateRagStatus } from './rag-status-calculator';

class Engine {
  constructor() {}

  // Method to calculate RAG status for a syllabus
  calculateRagStatus(syllabusData) {
    const ragStatus = calculateRagStatus(syllabusData);
    return ragStatus;
  }
}

export default Engine;