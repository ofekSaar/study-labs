from typing import List, Optional
from pydantic import BaseModel, Field

class Question(BaseModel):
    question_text: str = Field(..., description="The content of the question")
    options: List[str] = Field(..., description="List of possible answers")
    correct_answer: int = Field(..., description="Index of the correct answer in the options list")
    alignment_warning: bool = Field(False, description="True if the question may not be directly answerable from the summary")

class TopicContent(BaseModel):
    """Combined summary + quiz output from a single LLM call."""
    summary: str = Field(..., description="Comprehensive Markdown study guide, minimum 500 words with section headers")
    questions: List[Question] = Field(..., description="Exactly 3 multiple-choice questions testing key concepts")

class Topic(BaseModel):
    title: str = Field(..., description="Title of the topic")
    description: Optional[str] = Field(None, description="Brief description of the topic")
    summary: Optional[str] = Field(None, description="Detailed study summary/card for the topic")
    matched_materials: List[str] = Field(default_factory=list, description="List of material snippets or IDs matched to this topic")
    questions: List[Question] = Field(default_factory=list, description="List of generated questions for this topic")
    is_material_grounded: bool = Field(True, description="Flag indicating if the topic content is grounded in uploaded materials")
    quality_warning: bool = Field(False, description="True if the summary passed with marginal quality or failed validation after retries")

class Lesson(BaseModel):
    title: str = Field(..., description="Title of the lesson")
    topics: List[Topic] = Field(default_factory=list, description="List of topics covered in the lesson")

class Course(BaseModel):
    title: str = Field(..., description="Title of the course")
    lessons: List[Lesson] = Field(default_factory=list, description="List of lessons in the course")

