# AI Service API Contract

This document specifies the **exact API** that the external AI service must implement for the StudyLabs backend to integrate with it.

The StudyLabs backend calls these endpoints and expects the described request/response formats.

---

## Authentication

All requests include:

```
Authorization: Bearer <AI_SERVICE_API_KEY>
Content-Type: application/json
```

---

## Endpoint 1: Generate Course Roadmap

Generates a structured learning path (nodes) from course materials.

### Request

```
POST /api/generate-roadmap
```

**Body:**

```json
{
  "courseId": "663a1b...",
  "title": "Data Structures",
  "description": "A comprehensive course on data structures and algorithms",
  "materials": ["materials/uuid-syllabus.pdf", "materials/uuid-lecture1.mp4"],
  "aiConfig": {
    "nodeCount": 10,
    "quizFrequency": 3
  }
}
```

| Field                    | Type     | Required | Description                                  |
| ------------------------ | -------- | -------- | -------------------------------------------- |
| `courseId`               | string   | Yes      | MongoDB ObjectId of the course               |
| `title`                  | string   | Yes      | Course title                                 |
| `description`            | string   | Yes      | Course description                           |
| `materials`              | string[] | No       | Array of storage paths to uploaded materials |
| `aiConfig.nodeCount`     | number   | Yes      | Desired number of learning nodes (5-25)      |
| `aiConfig.quizFrequency` | number   | Yes      | Insert a quiz every N nodes (1-5)            |

### Expected Response

```json
{
  "nodes": [
    {
      "title": "Introduction to Data Structures",
      "type": "lesson",
      "order": 0,
      "estimatedMinutes": 45,
      "xpReward": 150,
      "lessonContent": "# Introduction to Data Structures\n\n## Overview\n\nData structures are fundamental...\n\n## Key Concepts\n\n- **Abstract Data Types (ADTs)**\n- **Time Complexity**\n- **Space Complexity**\n"
    },
    {
      "title": "Arrays & Strings",
      "type": "lesson",
      "order": 1,
      "estimatedMinutes": 50,
      "xpReward": 150,
      "lessonContent": "# Arrays & Strings\n\n## Arrays\n\nAn array is a contiguous block of memory..."
    },
    {
      "title": "Quiz 1: Foundations",
      "type": "quiz",
      "order": 2,
      "estimatedMinutes": 20,
      "xpReward": 200,
      "quizData": [
        {
          "type": "summary",
          "question": "Lesson Summary",
          "content": "Review the key concepts from Introduction and Arrays & Strings."
        },
        {
          "type": "mcq",
          "question": "What is the time complexity of accessing an element in an array by index?",
          "options": ["O(1)", "O(n)", "O(log n)", "O(n²)"],
          "correctAnswerIndex": 0,
          "explanation": "Array access by index is O(1) because arrays use contiguous memory."
        },
        {
          "type": "open",
          "question": "Explain the difference between an array and a linked list.",
          "minLength": 50,
          "aiPromptContext": "Data Structures: Arrays vs Linked Lists comparison"
        }
      ]
    }
  ]
}
```

### Node Types

| Type        | `lessonContent`                   | `quizData`                       |
| ----------- | --------------------------------- | -------------------------------- |
| `lesson`    | ✅ Markdown string (required)     | ❌                               |
| `quiz`      | ❌                                | ✅ Array of questions (required) |
| `project`   | ✅ Markdown with instructions     | ❌                               |
| `challenge` | ✅ Markdown with challenge prompt | ❌                               |
| `exam`      | ❌                                | ✅ Array of questions (required) |

### Quiz Question Types

| Type      | Fields                                                       |
| --------- | ------------------------------------------------------------ |
| `mcq`     | `question`, `options[]`, `correctAnswerIndex`, `explanation` |
| `open`    | `question`, `minLength`, `aiPromptContext`                   |
| `summary` | `question` ("Lesson Summary"), `content` (review text)       |

---

## Endpoint 2: Evaluate Open-Ended Answer

Evaluates a student's free-text answer against the expected concepts.

### Request

```
POST /api/evaluate-answer
```

**Body:**

```json
{
  "question": "Explain the difference between Authentication and Authorization.",
  "answer": "Authentication is the process of verifying who you are, like entering a password. Authorization determines what you are allowed to do after you've been identified, like admin vs regular user access.",
  "aiPromptContext": "Security basics: AuthN vs AuthZ"
}
```

| Field             | Type   | Required | Description                       |
| ----------------- | ------ | -------- | --------------------------------- |
| `question`        | string | Yes      | The question that was asked       |
| `answer`          | string | Yes      | Student's free-text answer        |
| `aiPromptContext` | string | No       | Additional context for evaluation |

### Expected Response

```json
{
  "isCorrect": true,
  "score": 85,
  "feedback": "Excellent answer! You correctly identified that authentication verifies identity while authorization controls access permissions. Consider also mentioning the Principle of Least Privilege for a more complete answer."
}
```

| Field       | Type           | Description                                      |
| ----------- | -------------- | ------------------------------------------------ |
| `isCorrect` | boolean        | Whether the answer meets the minimum quality bar |
| `score`     | number (0-100) | Quality score                                    |
| `feedback`  | string         | Detailed feedback for the student                |

---

## Error Responses

All errors should follow this format:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Course title is required"
  }
}
```

| HTTP Status | Code               | Description                      |
| ----------- | ------------------ | -------------------------------- |
| 400         | `INVALID_REQUEST`  | Missing or invalid parameters    |
| 401         | `UNAUTHORIZED`     | Invalid or missing API key       |
| 422         | `PROCESSING_ERROR` | AI could not process the content |
| 429         | `RATE_LIMIT`       | Too many requests                |
| 500         | `INTERNAL_ERROR`   | AI service internal error        |

---

## Integration Notes

1. **Base URL** is configured via `AI_SERVICE_URL` environment variable
2. **API Key** is sent via `AI_SERVICE_API_KEY` environment variable
3. **Timeout**: Backend expects responses within 60 seconds
4. **Lesson content** must be valid Markdown format
5. **Quiz questions** must include at least one MCQ question
6. **Node ordering** is respected — the AI should return nodes in the order they should be studied
