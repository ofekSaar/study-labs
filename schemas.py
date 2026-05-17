from pydantic import BaseModel
from typing import List

class ChallengeSchema(BaseModel):
    name: str
    description: str
    points: int

class LeaderboardSchema(BaseModel):
    user_id: int
    challenge_id: int
    score: int