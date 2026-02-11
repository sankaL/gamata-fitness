"""CSV import/export API routes."""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database import get_db_session
from core.permissions import AuthenticatedUser, get_current_user, require_role
from models.enums import UserRole
from schemas.import_export import CSVImportResponse
from services.import_export import (
    ImportExportServiceError,
    export_plan_csv,
    export_users_csv,
    export_workouts_csv,
    import_users_csv,
    import_workouts_csv,
)

router = APIRouter(tags=["import-export"])


def _to_http_exception(exc: ImportExportServiceError) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail=exc.detail)


def _csv_download_response(content: str, filename_prefix: str) -> Response:
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d")
    filename = f"{filename_prefix}-{timestamp}.csv"
    return Response(
        content=content,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


async def _read_csv_upload(upload: UploadFile) -> str:
    raw = await upload.read()
    if not raw:
        raise ImportExportServiceError("Uploaded CSV file is empty.", 400)
    try:
        return raw.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise ImportExportServiceError("CSV must be UTF-8 encoded.", 400) from exc


@router.get("/users/export")
@require_role([UserRole.ADMIN])
def get_users_export(
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> Response:
    _ = current_user
    try:
        csv_content = export_users_csv(db=db)
        return _csv_download_response(csv_content, "users-export")
    except ImportExportServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.get("/workouts/export")
@require_role([UserRole.ADMIN])
def get_workouts_export(
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> Response:
    _ = current_user
    try:
        csv_content = export_workouts_csv(db=db)
        return _csv_download_response(csv_content, "workouts-export")
    except ImportExportServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.get("/plans/{plan_id}/export")
@require_role([UserRole.COACH])
def get_plan_export(
    plan_id: UUID,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> Response:
    try:
        csv_content = export_plan_csv(db=db, coach_id=current_user.id, plan_id=plan_id)
        return _csv_download_response(csv_content, "plan-export")
    except ImportExportServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post("/users/import", response_model=CSVImportResponse)
@require_role([UserRole.ADMIN])
async def post_users_import(
    file: UploadFile = File(...),
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> CSVImportResponse:
    _ = current_user
    try:
        content = await _read_csv_upload(file)
        return import_users_csv(db=db, content=content)
    except ImportExportServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post("/workouts/import", response_model=CSVImportResponse)
@require_role([UserRole.ADMIN])
async def post_workouts_import(
    file: UploadFile = File(...),
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> CSVImportResponse:
    _ = current_user
    try:
        content = await _read_csv_upload(file)
        return import_workouts_csv(db=db, content=content)
    except ImportExportServiceError as exc:
        raise _to_http_exception(exc) from exc
