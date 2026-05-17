from fastapi import FastAPI, HTTPException
from services import ChallengeService, LeaderboardService

app = FastAPI()

challenge_service = ChallengeService()
leaderboard_service = LeaderboardService()

@app.get("/challenges")
async def get_challenges():
    return challenge_service.get_challenges()

@app.post("/challenges")
async def create_challenge(challenge: ChallengeSchema):
    new_challenge = challenge_service.create_challenge(challenge)
    return new_challenge

@app.get("/leaderboards")
async def get_leaderboards():
    return leaderboard_service.get_leaderboards()

@app.post("/leaderboards")
async def create_leaderboard(leaderboard: LeaderboardSchema):
    new_leaderboard = leaderboard_service.create_leaderboard(leaderboard)
    return new_leaderboard