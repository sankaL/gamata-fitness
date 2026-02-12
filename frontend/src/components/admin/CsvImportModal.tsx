import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import type { CSVImportResponse } from '@/types/import-export'

interface CsvImportModalProps {
  open: boolean
  title: string
  description: string
  isSubmitting: boolean
  result: CSVImportResponse | null
  onClose: () => void
  onSubmit: (file: File) => Promise<void>
}

export function CsvImportModal({
  open,
  title,
  description,
  isSubmitting,
  result,
  onClose,
  onSubmit,
}: CsvImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  const hasErrors = useMemo(() => (result?.errors.length ?? 0) > 0, [result?.errors.length])

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <section className="w-full max-w-3xl rounded-xl border border-border bg-card p-5 shadow-xl">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>

        <div className="mt-4 space-y-2">
          <label htmlFor="csv-upload" className="text-sm font-medium text-foreground">
            CSV file
          </label>
          <input
            id="csv-upload"
            type="file"
            accept=".csv,text/csv"
            className="block w-full rounded-md border border-border px-3 py-2 text-sm"
            onChange={(event) => {
              const nextFile = event.target.files?.[0] ?? null
              setSelectedFile(nextFile)
              setLocalError(null)
            }}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            disabled={isSubmitting}
            onClick={async () => {
              if (!selectedFile) {
                setLocalError('Select a CSV file to continue.')
                return
              }
              setLocalError(null)
              await onSubmit(selectedFile)
            }}
          >
            {isSubmitting ? 'Importing...' : 'Import CSV'}
          </Button>
          <Button
            variant="outline"
            disabled={isSubmitting}
            onClick={() => {
              setSelectedFile(null)
              setLocalError(null)
              onClose()
            }}
          >
            Close
          </Button>
        </div>

        {localError ? <p className="mt-3 text-sm text-destructive">{localError}</p> : null}

        {result ? (
          <section className="mt-5 space-y-3 rounded-lg border border-border bg-secondary p-4">
            <p className="text-sm text-foreground">
              Imported {result.imported_rows} of {result.total_rows} row(s)
            </p>
            {!hasErrors ? (
              <p className="text-sm text-emerald-300">No validation errors were found.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium text-amber-300">
                  Validation errors ({result.errors.length})
                </p>
                <div className="max-h-60 overflow-auto rounded border border-border bg-card">
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground">
                        <th className="px-3 py-2 font-medium">Row</th>
                        <th className="px-3 py-2 font-medium">Field</th>
                        <th className="px-3 py-2 font-medium">Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.map((item, index) => (
                        <tr key={`${item.row_number}-${item.field}-${index}`} className="border-b">
                          <td className="px-3 py-2 text-foreground">{item.row_number}</td>
                          <td className="px-3 py-2 text-foreground">{item.field}</td>
                          <td className="px-3 py-2 text-foreground">{item.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        ) : null}
      </section>
    </div>
  )
}
