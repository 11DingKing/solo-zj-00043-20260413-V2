from fastapi import HTTPException, Body, Header, Depends, APIRouter, Request, Query
from typing import Annotated, Dict, List, Optional
from schemas import (
    TokenSchema, 
    AddCategorySchema, 
    CategoryIdProvidedSchema, 
    UpdateCategorySchema,
    CategorySchema,
    HabitSchema
)
from uuid import uuid4
import datetime
from models import Users, Categories, Habits
from sqlalchemy.orm import Session
from depends_utils import (
    get_user_depends,
)
from db_utils import (
    commit,
    get_db,
    get_merged_user,
    construct_and_add_model_to_database,
    get_category_by_id,
    get_category_by_name_and_user,
    get_categories_by_user_id,
    delete_category_by_id,
    update_habits_category_to_null,
    get_habits_by_category_id,
    get_habits_without_category,
)
from ValidationUtils.validate_entries import validate_string
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from rate_limiter import limiter
import os
from dotenv import load_dotenv

category_router = APIRouter()
load_dotenv()

MAX_CATEGORIES = int(os.getenv("MAX_CATEGORIES"))


@category_router.post("/add_category")
@limiter.limit("20/minute")
async def add_category(
    request: Request,
    category: AddCategorySchema = Body(...),
    user: Users = Depends(get_user_depends),
    db: Session = Depends(get_db),
) -> CategorySchema:
    user = await get_merged_user(user=user, db=db)

    if len(user.categories) + 1 > MAX_CATEGORIES:
        raise HTTPException(
            status_code=400, detail=f"You can't add more categories. Each user can have up to {MAX_CATEGORIES} categories.")

    if not validate_string(category.category_name):
        raise HTTPException(
            status_code=400, detail="Invalid category name")

    existing_category = await get_category_by_name_and_user(
        db=db, 
        category_name=category.category_name, 
        user_id=user.user_id
    )
    if existing_category:
        raise HTTPException(
            status_code=400, detail="Category name already exists")

    category_id = str(uuid4())

    new_category = construct_and_add_model_to_database(
        db=db, Model=Categories,
        category_id=category_id,
        category_name=category.category_name,
        user_id=user.user_id,
        date_created=int(datetime.datetime.today().timestamp()),
        owner=user,
    )

    await commit(db)

    return CategorySchema(
        category_id=new_category.category_id,
        category_name=new_category.category_name,
        date_created=new_category.date_created,
    )


@category_router.get("/get_categories")
@limiter.limit("20/minute")
async def get_categories(
    request: Request,
    user: Users = Depends(get_user_depends),
    db: Session = Depends(get_db),
) -> List[CategorySchema]:
    user = await get_merged_user(user=user, db=db)
    
    categories = await get_categories_by_user_id(db=db, user_id=user.user_id)
    
    return [
        CategorySchema(
            category_id=cat.category_id,
            category_name=cat.category_name,
            date_created=cat.date_created,
        )
        for cat in categories
    ]


@category_router.put("/update_category")
@limiter.limit("20/minute")
async def update_category(
    request: Request,
    category_data: UpdateCategorySchema = Body(...),
    user: Users = Depends(get_user_depends),
    db: Session = Depends(get_db),
) -> CategorySchema:
    user = await get_merged_user(user=user, db=db)

    if not validate_string(category_data.category_name):
        raise HTTPException(
            status_code=400, detail="Invalid category name")

    category = await get_category_by_id(db=db, category_id=category_data.category_id)
    if not category:
        raise HTTPException(
            status_code=400, detail="Category not found")

    if category.user_id != user.user_id:
        raise HTTPException(
            status_code=401, detail="Unauthorized. You're not owner of this category")

    existing_category = await get_category_by_name_and_user(
        db=db, 
        category_name=category_data.category_name, 
        user_id=user.user_id
    )
    if existing_category and existing_category.category_id != category_data.category_id:
        raise HTTPException(
            status_code=400, detail="Category name already exists")

    category.category_name = category_data.category_name
    await commit(db)

    return CategorySchema(
        category_id=category.category_id,
        category_name=category.category_name,
        date_created=category.date_created,
    )


@category_router.post("/delete_category")
@limiter.limit("20/minute")
async def delete_category(
    request: Request,
    category: CategoryIdProvidedSchema = Body(...),
    user: Users = Depends(get_user_depends),
    db: Session = Depends(get_db),
) -> None:
    user = await get_merged_user(user=user, db=db)

    category_to_delete = await get_category_by_id(db=db, category_id=category.category_id)
    if not category_to_delete:
        raise HTTPException(
            status_code=400, detail="Category not found")

    if category_to_delete.user_id != user.user_id:
        raise HTTPException(
            status_code=401, detail="Unauthorized. You're not owner of this category")

    await update_habits_category_to_null(db=db, category_id=category.category_id)

    await delete_category_by_id(db=db, category_id=category.category_id)

    await commit(db)


@category_router.get("/get_habits_by_category")
@limiter.limit("20/minute")
async def get_habits_by_category(
    request: Request,
    category_id: Optional[str] = Query(None),
    user: Users = Depends(get_user_depends),
    db: Session = Depends(get_db),
) -> List[HabitSchema]:
    user = await get_merged_user(user=user, db=db)

    if category_id is None:
        habits = await get_habits_without_category(db=db, user_id=user.user_id)
    elif category_id == "all":
        habits = user.habits
    else:
        category = await get_category_by_id(db=db, category_id=category_id)
        if not category:
            raise HTTPException(
                status_code=400, detail="Category not found")
        if category.user_id != user.user_id:
            raise HTTPException(
                status_code=401, detail="Unauthorized. You're not owner of this category")
        
        habits = await get_habits_by_category_id(db=db, category_id=category_id, user_id=user.user_id)

    return habits
