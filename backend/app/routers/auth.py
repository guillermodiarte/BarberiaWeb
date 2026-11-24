from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Optional
from backend.app.database import get_db
from backend.app.models import User, ServiceRecord
from backend.app.schemas import LoginRequest, Token, UserOut, UserUpdate, AccountDeletionRequest
from backend.app.auth import verify_password, get_password_hash, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])

@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email.lower().strip()).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo electrónico o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Esta cuenta ha sido suspendida o desactivada por un administrador"
        )
    
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

# Also support OAuth2 form login for OpenAPI /docs Swagger testing
@router.post("/token", response_model=Token, include_in_schema=False)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username.lower().strip()).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo electrónico o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cuenta suspendida o desactivada"
        )
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserOut)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserOut)
def update_profile(update_data: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if update_data.full_name is not None:
        current_user.full_name = update_data.full_name
    if update_data.phone is not None:
        current_user.phone = update_data.phone
    if update_data.password:
        current_user.hashed_password = get_password_hash(update_data.password)
    
    # Role or payment scheme can only be modified by admin, not self
    if current_user.role == "admin":
        if update_data.email is not None:
            current_user.email = update_data.email.lower().strip()
    
    db.commit()
    db.refresh(current_user)
    return current_user


@router.delete("/me")
def delete_own_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cumplimiento de Google Play: Permite al usuario autenticado eliminar su propia cuenta y purgar sus datos.
    """
    if current_user.role == "superadmin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La cuenta principal de SuperAdmin no puede ser eliminada directamente"
        )
    
    # Verificar si tiene registros históricos vinculados
    has_records = db.query(ServiceRecord).filter(ServiceRecord.barber_id == current_user.id).count() > 0
    
    if has_records:
        import time
        # Anonimizar todos los datos personales (cumplimiento GDPR / Google Play)
        current_user.full_name = "Usuario Eliminado"
        current_user.phone = None
        current_user.email = f"deleted_{current_user.id}_{int(time.time())}@anonymized.local"
        current_user.hashed_password = get_password_hash(f"deleted_{time.time()}")
        current_user.is_active = False
        db.commit()
    else:
        db.delete(current_user)
        db.commit()
        
    return {"success": True, "message": "Tu cuenta y datos personales han sido eliminados exitosamente."}


@router.post("/request-deletion")
def request_account_deletion(
    req: AccountDeletionRequest,
    db: Session = Depends(get_db)
):
    """
    Cumplimiento de Google Play: Permite solicitar la eliminación de cuenta desde la pantalla de login
    (incluso si la cuenta se encuentra bloqueada o suspendida).
    """
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user:
        raise HTTPException(status_code=404, detail="No se encontró una cuenta con ese correo electrónico")
        
    if user.role == "superadmin":
        raise HTTPException(status_code=400, detail="La cuenta de SuperAdmin no puede ser eliminada")
        
    # Si la cuenta está activa y mandó contraseña, validarla
    if user.is_active and req.password:
        if not verify_password(req.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Contraseña incorrecta")

    has_records = db.query(ServiceRecord).filter(ServiceRecord.barber_id == user.id).count() > 0
    import time
    if has_records:
        user.full_name = "Usuario Eliminado"
        user.phone = None
        user.email = f"deleted_{user.id}_{int(time.time())}@anonymized.local"
        user.hashed_password = get_password_hash(f"deleted_{time.time()}")
        user.is_active = False
        db.commit()
    else:
        db.delete(user)
        db.commit()

    return {
        "success": True,
        "message": "La solicitud de eliminación fue procesada. Tu cuenta y datos personales han sido eliminados."
    }


