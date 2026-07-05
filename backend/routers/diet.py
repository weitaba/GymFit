"""POST diet text analysis."""

from fastapi import APIRouter
from pydantic import BaseModel
from models.schemas import DietRecommendRequest
from services.analysis_service import analyze_diet, estimate_food

router = APIRouter()


class FoodEstimateRequest(BaseModel):
    food: str
    amount: str
    provider: str | None = None
    model: str | None = None
    api_key: str | None = None


@router.post("/diet/recommend")
async def diet_recommend(req: DietRecommendRequest):
    return await analyze_diet(
        diet_type_id=req.diet_type_id,
        user_input=req.user_input,
        provider_name=req.provider or (req.user_input.get('provider') if isinstance(req.user_input, dict) else None),
        model=req.model or (req.user_input.get('model') if isinstance(req.user_input, dict) else None),
    )


@router.post("/diet/estimate-food")
async def estimate_food_endpoint(req: FoodEstimateRequest):
    return await estimate_food(food=req.food, amount=req.amount, provider_name=req.provider, model=req.model, api_key=req.api_key)
