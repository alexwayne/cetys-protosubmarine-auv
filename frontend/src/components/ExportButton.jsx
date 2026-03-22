/**
 * Triggers a CSV download for the given session.
 * Renders nothing when no session is active.
 */
export default function ExportButton({ sessionId }) {
  if (!sessionId) return null

  return (
    <button
      onClick={() => window.open(`http://localhost:8000/sessions/${sessionId}/export`, '_blank')}
      className="px-4 py-1.5 rounded-md text-sm font-medium
        bg-gray-200 dark:bg-gray-700
        hover:bg-gray-300 dark:hover:bg-gray-600
        text-gray-700 dark:text-gray-200
        border border-gray-300 dark:border-gray-600
        transition-colors"
    >
      Exportar CSV
    </button>
  )
}
