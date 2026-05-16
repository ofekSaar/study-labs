# StudyLabs 🚀
**Transforming passive materials into interactive learning journeys.**

StudyLabs is an AI-first, gamified learning platform that automates the transition from traditional static content to engaging digital education.

## 💡 The Core Business Idea

Modern education faces a "Passive Consumption" problem. Students are overwhelmed with static PDFs and slide decks, leading to low engagement and poor retention. At the same time, instructors are overburdened by the manual effort required to transform their expertise into interactive digital formats.

**StudyLabs solves both sides of this equation:**

### 🎯 For Instructors: Automation at Scale
StudyLabs acts as an AI teaching assistant. By simply uploading a syllabus and existing course materials, instructors can launch a fully-featured digital course in minutes, not weeks.
- **Automated Roadmap Generation**: AI decomposes complex syllabi into logical, bite-sized learning nodes.
- **Content Synthesis**: The engine automatically extracts key concepts to create summaries and focused lessons.
- **Instant Assessment**: Interactive quizzes are generated directly from the uploaded material, ensuring they are perfectly aligned with the curriculum.

### 🎮 For Students: The Gamification of Knowledge
StudyLabs turns the curriculum into a visual quest. By applying game mechanics to academic content, we drive higher engagement and completion rates.
- **Visual Progress**: Students traverse a dynamic roadmap where every completed node is a milestone.
- **XP & Achievement**: Every interaction—from reading a summary to acing a quiz—earns experience points (XP), providing immediate positive reinforcement.
- **Bite-Sized Learning**: Content is served in manageable chunks, reducing cognitive load and making study sessions more effective.

---

## 🏗️ Architecture Overview

StudyLabs is composed of three specialized services designed for scale and flexibility:

*   **[Frontend](./frontend)**: A high-performance React 19 application using Tailwind CSS for a premium, gamified user experience.
*   **[Backend](./backend)**: A Node.js & Express API that handles orchestration, user progress, and secure storage.
*   **[AI Engine](./ai-engine)**: A Python-based FastAPI service leveraging **LlamaIndex** and advanced LLMs to transform raw files into structured educational data.

---

## 🚀 Getting Started

To spin up the entire ecosystem locally using Docker:

1.  **Environment Setup**:
    ```bash
    cp .env.example .env
    # Add your Gemini, OpenAI, or OpenRouter API keys to the .env file
    ```

2.  **Launch**:
    ```bash
    docker compose up --build
    ```

3.  **Explore**:
    - **App**: [http://localhost:5173](http://localhost:5173)
    - **Backend API**: [http://localhost:5001/api-docs](http://localhost:5001/api-docs)
    - **AI Engine API**: [http://localhost:8001/docs](http://localhost:8001/docs)

---

## 📖 Further Documentation

- **[AI Service Contract](./backend/AI_SERVICE_CONTRACT.md)**: Details on the communication between the Backend and AI Engine.
- **[Development Guide](./CLAUDE.md)**: Comprehensive guide for developers working on the codebase.
