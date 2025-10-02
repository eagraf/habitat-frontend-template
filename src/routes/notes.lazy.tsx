import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createLazyFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { listPrivateNotes, putPrivateNoteRecord } from '../api/notes_client'
import type { ListRecordsResponse } from '../sdk/atproto'

export const Route = createLazyFileRoute('/notes')({
  component: Notes,
})

function Notes() {
  const [newNote, setNewNote] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const queryClient = useQueryClient()

  // Query for fetching notes
  const { data: notesData, isLoading, error, refetch } = useQuery({
    queryKey: ['notes'],
    queryFn: listPrivateNotes,
    retry: 2,
  })

  // Mutation for creating a new note
  const createNoteMutation = useMutation({
    mutationFn: (note: string) => putPrivateNoteRecord(note),
    onSuccess: () => {
      // Invalidate and refetch notes after successful creation
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      setNewNote('')
      setIsCreating(false)
    },
    onError: (error) => {
      console.error('Failed to create note:', error)
      setIsCreating(false)
    },
  })

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim()) return

    setIsCreating(true)
    createNoteMutation.mutate(newNote.trim())
  }

  const handleToggleCreate = () => {
    setIsCreating(!isCreating)
    if (isCreating) {
      setNewNote('')
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Notes</h1>
        <button
          onClick={handleToggleCreate}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {isCreating ? 'Cancel' : 'Create Note'}
        </button>
      </div>

      {/* Create Note Form */}
      {isCreating && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <form onSubmit={handleCreateNote} className="space-y-4">
            <div>
              <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
                New Note
              </label>
              <textarea
                id="note"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                disabled={createNoteMutation.isPending}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!newNote.trim() || createNoteMutation.isPending}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {createNoteMutation.isPending ? 'Creating...' : 'Create Note'}
              </button>
              <button
                type="button"
                onClick={handleToggleCreate}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Notes List */}
      <div className="space-y-4">
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">Loading notes...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-red-500 mr-2">⚠️</div>
              <div>
                <h3 className="text-red-800 font-medium">Error loading notes</h3>
                <p className="text-red-600 text-sm mt-1">
                  {error instanceof Error ? error.message : 'An unknown error occurred'}
                </p>
                <button
                  onClick={() => refetch()}
                  className="mt-2 text-red-600 hover:text-red-800 underline text-sm"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {notesData && !isLoading && (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-600">
                {notesData.records?.length || 0} note(s) found
              </p>
              <button
                onClick={() => refetch()}
                className="text-blue-600 hover:text-blue-800 underline text-sm"
              >
                Refresh
              </button>
            </div>

            {notesData.records && notesData.records.length > 0 ? (
              <div className="grid gap-4">
                {notesData.records.map((record: ListRecordsResponse['records'][number]) => (
                  <div
                    key={record.uri}
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm text-gray-500">
                        {record.value?.createdAt ? 
                          new Date(record.value.createdAt).toLocaleString() : 
                          'Unknown date'
                        }
                      </div>
                      <div className="text-xs text-gray-400 font-mono">
                        {record.uri ? (
                          record.uri.split('/').pop()?.slice(0, 8)
                        ) : (
                          'Unknown URI'
                        )}
                      </div>
                    </div>
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {record.value?.note || 'No content'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <div className="text-gray-400 text-6xl mb-4">📝</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notes yet</h3>
                <p className="text-gray-600 mb-4">Create your first note to get started!</p>
                <button
                  onClick={handleToggleCreate}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Create Note
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
