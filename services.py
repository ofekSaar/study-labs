from fastapi import HTTPException
from models import Challenge, Leaderboard
from schemas import ChallengeSchema, LeaderboardSchema

class ChallengeService:
    def get_challenges(self):
        return [Challenge(id=1, name="Challenge 1", description="Desc 1", points=10),
                Challenge(id=2, name="Challenge 2", description="Desc 2", points=20)]

    def create_challenge(self, challenge: ChallengeSchema):
        new_challenge = Challenge(id=len(self.get_challenges()) + 1,
                                  name=challenge.name,
                                  description=challenge.description,
                                  points=challenge.points)
        return new_challenge

class LeaderboardService:
    def get_leaderboards(self):
        return [Leaderboard(id=1, user_id=1, challenge_id=1, score=100),
                Leaderboard(id=2, user_id=2, challenge_id=2, score=200)]

    def create_leaderboard(self, leaderboard: LeaderboardSchema):
        new_leaderboard = Leaderboard(id=len(self.get_leaderboards()) + 1,
                                      user_id=leaderboard.user_id,
                                      challenge_id=leaderboard.challenge_id,
                                      score=leaderboard.score)
        return new_leaderboard