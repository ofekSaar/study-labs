from typing import List
from pydantic import BaseModel

class User(BaseModel):
    id: int
    name: str
    email: str

class Course(BaseModel):
    id: int
    title: str
    description: str

class Lesson(BaseModel):
    id: int
    title: str
    description: str
    course_id: int

class PathItem(BaseModel):
    id: int
    name: str
    description: str
    user_id: int
    lesson_ids: List[int]

class AdaptiveLearningPath(BaseModel):
    id: int
    name: str
    description: str
    user_id: int
    path_item_ids: List[int]