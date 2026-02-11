export interface CSVImportErrorItem {
  row_number: number
  field: string
  message: string
}

export interface CSVImportResponse {
  total_rows: number
  imported_rows: number
  errors: CSVImportErrorItem[]
}
