from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from models import MasteryBadge, UserMasteryBadges

router = APIRouter()

@router.get("/mastery-badges/")
async def get_mastery_badges(db: Session = Depends()):
    result = db.execute(select(MasteryBadge))
    return result.all()

@router.post("/mastery-badges/")
async def create_mastery_badge(mastery_badge: MasteryBadge, db: Session = Depends()):
    db.add(mastery_badge)
    db.commit()
    return mastery_badge

@router.get("/user-mastery-badges/{user_id}")
async def get_user_mastery_badges(user_id: int, db: Session = Depends()):
    result = db.execute(select(UserMasteryBadges).where(UserMasteryBadges.user_id == user_id))
    return result.all()

@router.post("/user-mastery-badges/")
async def create_user_mastery_badge(user_mastery_badge: UserMasteryBadges, db: Session = Depends()):
    db.add(user_mastery_badge)
    db.commit()
    return user_mastery_badge