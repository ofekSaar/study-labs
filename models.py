from typing import List
from pydantic import BaseModel

class Skill(BaseModel):
    id: int
    name: str
    description: str

class Node(BaseModel):
    id: int
    skill_id: int
    parent_id: int
    children: List[int]

class Tree(BaseModel):
    id: int
    name: str
    nodes: List[Node]