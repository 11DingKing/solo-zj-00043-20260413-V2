from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.orm import DeclarativeBase
from database import engine
import asyncio


class Base(DeclarativeBase):
    pass


class Users(Base):
    __tablename__ = "users"

    user_id = Column(String, primary_key=True, index=True)
    username = Column(String)
    hashed_password = Column(String)
    joined_at = Column(Integer)
    email = Column(String)
    xp = Column(Integer, default=0)
    level = Column(Integer, default=0)

    habits = relationship("Habits", back_populates="owner",
                          cascade="all,delete", lazy="selectin")
    completions = relationship(
        "HabitCompletions", back_populates="owner", cascade="all,delete", lazy="selectin")
    categories = relationship(
        "Categories", back_populates="owner", cascade="all,delete", lazy="selectin")


class Categories(Base):
    __tablename__ = "categories"

    category_id = Column(String, primary_key=True, index=True)
    category_name = Column(String, index=True)
    user_id = Column(String, ForeignKey("users.user_id"))
    date_created = Column(Integer)

    __table_args__ = (
        UniqueConstraint('user_id', 'category_name', name='unique_category_name_per_user'),
    )

    habits = relationship(
        "Habits", back_populates="category", lazy="selectin")
    owner = relationship("Users", back_populates="categories", lazy="selectin")


class JWTTable(Base):
    __tablename__ = "jwttable"

    user_id = Column(String, ForeignKey("users.user_id"))
    jwt_token = Column(String, primary_key=True, index=True)
    expires_at = Column(Integer)


class Habits(Base):
    __tablename__ = "habits"

    habit_id = Column(String, primary_key=True, index=True)
    habit_name = Column(String)
    habit_desc = Column(String)
    user_id = Column(String, ForeignKey("users.user_id"))
    category_id = Column(String, ForeignKey("categories.category_id"), nullable=True)
    date_created = Column(Integer)
    completed = Column(Boolean, default=False)
    reset_at = Column(JSON)

    completions = relationship(
        "HabitCompletions", back_populates="habit", cascade="all,delete", lazy="selectin")
    owner = relationship("Users", back_populates="habits", lazy="selectin")
    category = relationship("Categories", back_populates="habits", lazy="selectin")


class HabitCompletions(Base):
    __tablename__ = "habitcompletions"

    completion_id = Column(String, primary_key=True)
    habit_id = Column(String, ForeignKey("habits.habit_id"))
    habit_name = Column(String)
    user_id = Column(String, ForeignKey("users.user_id"))
    completed_at = Column(Integer)
    xp_given = Column(Integer)

    owner = relationship(
        "Users", back_populates="completions", lazy="selectin")
    habit = relationship(
        "Habits", back_populates="completions", lazy="selectin")