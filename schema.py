from pydantic import BaseModel

class AdaptiveLearningPathSchema(BaseModel):
    id: int
    name: str
    description: str
    user_id: int
    path_item_ids: List[int]