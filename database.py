from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

engine = create_engine("sqlite:///mastery-badges.db")
SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()

class MasteryBadge(Base):
    __tablename__ = "mastery_badges"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    description = Column(String)
    image_url = Column(String)

class UserMasteryBadges(Base):
    __tablename__ = "user_mastery_badges"
    user_id = Column(Integer, primary_key=True)
    mastery_badge_id = Column(Integer, primary_key=True)