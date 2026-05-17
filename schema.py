from pydantic import BaseModel

class MasteryBadgeSchema(BaseModel):
    name: str
    description: str
    image_url: str

class UserMasteryBadgesSchema(BaseModel):
    user_id: int
    mastery_badge_id: int