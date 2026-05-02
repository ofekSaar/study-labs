# StudyLabs AI Engine

This repository contains the AI engine for StudyLabs, built with FastAPI and LlamaIndex.

## Setup

1.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

2.  **Environment Variables**:
    Create a `.env` file in the root directory with the following keys:
    ```
    GEMINI_API_KEY=your_gemini_api_key
    # OR
    OPENAI_API_KEY=your_openai_api_key
    ```
    
    > **Note**: If using OpenRouter, you may need to adjust `engine/generator.py` to support it again or map it to `OPENAI_API_KEY` with a custom base URL if the library supports it. Currently, the code prioritizes Gemini.

3.  **Run Server**:
    ```bash
    python main.py
    # or
    uvicorn main:app --reload
    ```

## API Usage

### Generate Course

**Endpoint**: `POST /api/generate-course/`

**Content-Type**: `application/json`

**Body**:
*   `courseId` (string): Unique identifier for the course.
*   `syllabusPath` (string): Absolute or relative path to the syllabus PDF file (in the shared volume).
*   `materialsPaths` (list of strings): List of paths to course materials (PDFs).

**Example using Python requests**:
```python
import requests

url = "http://localhost:8000/api/generate-course/"
payload = {
    "courseId": "1234567890abcdef",
    "syllabusPath": "/app/uploads/syllabus.pdf",
    "materialsPaths": [
        "/app/uploads/lecture1.pdf",
        "/app/uploads/lecture2.pdf"
    ]
}
headers = {"Content-Type": "application/json"}
response = requests.post(url, json=payload, headers=headers)
print(response.json())
```

## API Documentation

The API comes with built-in documentation and visualization through Swagger UI.

*   **Swagger UI**: `http://localhost:8000/docs`
*   **ReDoc**: `http://localhost:8000/redoc`
*   **OpenAPI Schema**: `http://localhost:8000/openapi.json`

## Testing

A standalone test script is provided in `scripts/test_full_flow.py`.
run it with:
```bash
python scripts/test_full_flow.py
```
Ensure the server is running before executing the test script.
