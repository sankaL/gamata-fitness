import { useState } from 'react'

import { useExportUsersCsvMutation, useImportUsersCsvMutation } from '@/hooks/use-admin-users'
import { downloadFile } from '@/lib/download'
import type { CSVImportResponse } from '@/types/import-export'

interface UseAdminUsersCsvOptions {
  onError: (message: string) => void
  onToast: (message: string, type: 'success' | 'error' | 'info') => void
}

export function useAdminUsersCsv({ onError, onToast }: UseAdminUsersCsvOptions) {
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [importResult, setImportResult] = useState<CSVImportResponse | null>(null)
  const exportUsersMutation = useExportUsersCsvMutation()
  const importUsersMutation = useImportUsersCsvMutation()

  async function handleExportUsersCsv() {
    try {
      const file = await exportUsersMutation.mutateAsync()
      downloadFile(file)
      onToast('Users CSV downloaded.', 'success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to export users CSV.'
      onError(message)
      onToast(message, 'error')
    }
  }

  async function handleImportUsersCsv(file: File) {
    try {
      const response = await importUsersMutation.mutateAsync(file)
      setImportResult(response)
      onToast(
        response.errors.length === 0
          ? `Imported ${response.imported_rows} user(s).`
          : `Imported ${response.imported_rows} user(s) with ${response.errors.length} error(s).`,
        response.errors.length === 0 ? 'success' : 'info',
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to import users CSV.'
      onError(message)
      onToast(message, 'error')
    }
  }

  return {
    isImportOpen,
    setIsImportOpen,
    importResult,
    setImportResult,
    exportUsersMutation,
    importUsersMutation,
    handleExportUsersCsv,
    handleImportUsersCsv,
  }
}
