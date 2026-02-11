"""Pydantic schemas for CSV import/export workflows."""

from __future__ import annotations

from pydantic import BaseModel, Field


class CSVImportErrorItem(BaseModel):
    row_number: int = Field(ge=1)
    field: str
    message: str


class CSVImportResponse(BaseModel):
    total_rows: int = Field(ge=0)
    imported_rows: int = Field(ge=0)
    errors: list[CSVImportErrorItem] = Field(default_factory=list)
