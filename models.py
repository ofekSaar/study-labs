from typing import List
from pydantic import BaseModel

class MasteryBadge(BaseModel):
    id: int
    name: str
    description: str
    image_url: str

class UserMasteryBadges(BaseModel):
    user_id: int
    mastery_badge_id: int