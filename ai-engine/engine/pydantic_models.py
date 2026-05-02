from typing import List, Optional
from pydantic import BaseModel, Field

class Question(BaseModel):
    question_text: str = Field(..., description="The content of the question")
    options: List[str] = Field(..., description="List of possible answers")
    correct_answer: int = Field(..., description="Index of the correct answer in the options list")

class Topic(BaseModel):
    title: str = Field(..., description="Title of the topic")
    description: Optional[str] = Field(None, description="Brief description of the topic")
    summary: Optional[str] = Field(None, description="Detailed study summary/card for the topic")
    matched_materials: List[str] = Field(default_factory=list, description="List of material snippets or IDs matched to this topic")
    questions: List[Question] = Field(default_factory=list, description="List of generated questions for this topic")

class Lesson(BaseModel):
    title: str = Field(..., description="Title of the lesson")
    topics: List[Topic] = Field(default_factory=list, description="List of topics covered in the lesson")

class Course(BaseModel):
    title: str = Field(..., description="Title of the course")
    lessons: List[Lesson] = Field(default_factory=list, description="List of lessons in the course")
