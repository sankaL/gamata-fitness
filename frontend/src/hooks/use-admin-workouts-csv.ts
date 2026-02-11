import { useState } from 'react'

import {
  useExportWorkoutsCsvMutation,
  useImportWorkoutsCsvMutation,
} from '@/hooks/use-admin-workouts'
import { downloadFile } from '@/lib/download'
import type { CSVImportResponse } from '@/types/import-export'

interface UseAdminWorkoutsCsvOptions {
  onError: (message: string) => void
  onToast: (message: string, type: 'success' | 'error' | 'info') => void
}

export function useAdminWorkoutsCsv({ onError, onToast }: UseAdminWorkoutsCsvOptions) {
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [importResult, setImportResult] = useState<CSVImportResponse | null>(null)
  const exportWorkoutsMutation = useExportWorkoutsCsvMutation()
  const importWorkoutsMutation = useImportWorkoutsCsvMutation()

  async function handleExportWorkoutsCsv() {
    try {
      const file = await exportWorkoutsMutation.mutateAsync()
      downloadFile(file)
      onToast('Workouts CSV downloaded.', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to export workouts CSV.'
      onError(message)
      onToast(message, 'error')
    }
  }

  async function handleImportWorkoutsCsv(file: File) {
    try {
      const response = await importWorkoutsMutation.mutateAsync(file)
      setImportResult(response)
      onToast(
        response.errors.length === 0
          ? `Imported ${response.imported_rows} workout(s).`
          : `Imported ${response.imported_rows} workout(s) with ${response.errors.length} error(s).`,
        response.errors.length === 0 ? 'success' : 'info',
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to import workouts CSV.'
      onError(message)
      onToast(message, 'error')
    }
  }

  return {
    isImportOpen,
    setIsImportOpen,
    importResult,
    setImportResult,
    exportWorkoutsMutation,
    importWorkoutsMutation,
    handleExportWorkoutsCsv,
    handleImportWorkoutsCsv,
  }
}
