from pydantic import BaseModel

class SkillSchema(BaseModel):
    name: str
    description: str

class NodeSchema(BaseModel):
    skill_id: int
    parent_id: int

class TreeSchema(BaseModel):
    name: str
    nodes: List[NodeSchema]