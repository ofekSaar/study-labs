# StudyLabs AI Engine

This repository contains the AI engine for StudyLabs, built with Django and LlamaIndex.

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

3.  **Run Migrations**:
    ```bash
    python manage.py migrate
    ```

4.  **Run Server**:
    ```bash
    python manage.py runserver
    ```

## API Usage

### Generate Course

**Endpoint**: `POST /api/generate-course/`

**Content-Type**: `multipart/form-data`

**Body**:
*   `syllabus`: JSON file or PDF file (Syllabus content). *Currently supports PDF.*
*   `materials`: List of PDF files.

**Example using Python requests**:
```python
import requests

url = "http://localhost:8000/api/generate-course/"
files = [
    ('syllabus', open('example_materials/syllabus.pdf', 'rb')),
    ('materials', open('example_materials/lecture1.pdf', 'rb')),
    ('materials', open('lecture2.pdf', 'rb'))
]
response = requests.post(url, files=files)
print(response.json())
```

## API Documentation

The API comes with built-in documentation and visualization through Swagger UI.

*   **Swagger UI**: `http://localhost:8000/api/schema/swagger-ui/`
*   **ReDoc**: `http://localhost:8000/api/schema/redoc/`
*   **OpenAPI Schema**: `http://localhost:8000/api/schema/`

## Testing

A standalone test script is provided in `scripts/test_full_flow.py`.
run it with:
```bash
python scripts/test_full_flow.py
```
Ensure the server is running before executing the test script.
