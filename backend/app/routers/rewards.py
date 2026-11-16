from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import LoyaltyReward, Customer, LoyaltyTransaction, User
from backend.app.schemas import LoyaltyRewardCreate, LoyaltyRewardOut, LoyaltyRedeemRequest
from backend.app.auth import require_admin, require_barber_or_admin

router = APIRouter(prefix="/api/rewards", tags=["Premios y Recompensas (Fidelización)"])

@router.get("", response_model=List[LoyaltyRewardOut])
def list_rewards(db: Session = Depends(get_db)):
    return db.query(LoyaltyReward).filter(LoyaltyReward.is_active == True).order_by(LoyaltyReward.points_required.asc()).all()

@router.post("", response_model=LoyaltyRewardOut, status_code=status.HTTP_201_CREATED)
def create_reward(
    rew_in: LoyaltyRewardCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    reward = LoyaltyReward(
        title=rew_in.title,
        description=rew_in.description,
        points_required=rew_in.points_required,
        reward_type=rew_in.reward_type,
        discount_value=rew_in.discount_value,
        is_active=True
    )
    db.add(reward)
    db.commit()
    db.refresh(reward)
    return reward

@router.delete("/{reward_id}")
def delete_reward(
    reward_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    rew = db.query(LoyaltyReward).filter(LoyaltyReward.id == reward_id).first()
    if not rew:
        raise HTTPException(status_code=404, detail="Premio no encontrado")
    rew.is_active = False
    db.commit()
    return {"message": "Premio desactivado"}

@router.post("/redeem")
def redeem_reward(
    redeem_in: LoyaltyRedeemRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_barber_or_admin)
):
    customer = db.query(Customer).filter(Customer.id == redeem_in.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    reward = db.query(LoyaltyReward).filter(LoyaltyReward.id == redeem_in.reward_id, LoyaltyReward.is_active == True).first()
    if not reward:
        raise HTTPException(status_code=404, detail="Premio no encontrado o no disponible")

    if customer.loyalty_points < reward.points_required:
        raise HTTPException(
            status_code=400,
            detail=f"Puntos insuficientes. El cliente tiene {customer.loyalty_points} pts y se requieren {reward.points_required} pts."
        )

    # Deduct points
    customer.loyalty_points -= reward.points_required

    # Log transaction
    tx = LoyaltyTransaction(
        customer_id=customer.id,
        points_change=-reward.points_required,
        reason=f"Canje de premio: {reward.title}",
        reference_id=f"reward_{reward.id}"
    )
    db.add(tx)
    db.commit()

    return {
        "success": True,
        "message": f"¡Premio '{reward.title}' canjeado con éxito para {customer.full_name}!",
        "points_redeemed": reward.points_required,
        "new_balance": customer.loyalty_points,
        "reward": {
            "id": reward.id,
            "title": reward.title,
            "reward_type": reward.reward_type,
            "discount_value": reward.discount_value
        }
    }

