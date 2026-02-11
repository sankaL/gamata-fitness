"""Shared types/helpers for CSV import/export services."""

from __future__ import annotations


class ImportExportServiceError(Exception):
    """Raised for client-safe CSV import/export failures."""

    def __init__(self, detail: str, status_code: int) -> None:
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code
