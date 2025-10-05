import { useQuery } from '@tanstack/react-query'
import { createLazyFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { HabitatClient, getUserDid, getDefaultAgent } from '../sdk/atproto'

const defaultLexicons = ['dev.eagraf.note'];

export const Route = createLazyFileRoute('/data')({
  component: () => <DataDebugger lexicons={defaultLexicons} />,
})

interface DataDebuggerProps {
  lexicons: string[]
}

interface FilterCriteria {
  [key: string]: string
}

function DataDebugger({ lexicons }: DataDebuggerProps) {
  const [selectedLexicon, setSelectedLexicon] = useState<string>('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [filterText, setFilterText] = useState('')
  const [parsedFilters, setParsedFilters] = useState<FilterCriteria>({})

  // Parse filter text into key-value pairs
  const parseFilters = (text: string): FilterCriteria => {
    const filters: FilterCriteria = {}
    const parts = text.trim().split(/\s+/)
    
    for (const part of parts) {
      if (part.includes(':')) {
        const [key, ...valueParts] = part.split(':')
        const value = valueParts.join(':') // Handle values that might contain colons
        if (key && value) {
          filters[key] = value
        }
      }
    }
    
    return filters
  }

  // Update filters when filter text changes
  const handleFilterChange = (text: string) => {
    setFilterText(text)
    setParsedFilters(parseFilters(text))
  }

  // Fetch data based on selected lexicon and privacy setting
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['data-debugger', selectedLexicon, isPrivate],
    queryFn: async () => {
      if (!selectedLexicon) {
        return null
      }
      
      const client = new HabitatClient(getUserDid(), getDefaultAgent())
      
      if (isPrivate) {
        return await client.listPrivateRecords({
          collection: selectedLexicon,
        })
      } else {
        return await client.listRecords({
          collection: selectedLexicon,
        })
      }
    },
    enabled: !!selectedLexicon,
    retry: 2,
  })

  // Filter records based on parsed filter criteria
  const filteredRecords = useMemo(() => {
    if (!data) return []
    
    const records = 'data' in data ? data.data.records : data.records
    
    if (Object.keys(parsedFilters).length === 0) {
      return records
    }

    return records.filter((record) => {
      // Check all filter criteria
      for (const [key, value] of Object.entries(parsedFilters)) {
        if (key === 'rkey') {
          // Extract rkey from URI
          const rkey = record.uri?.split('/').pop()
          if (!rkey || !rkey.includes(value)) {
            return false
          }
        } else {
          // Check top-level fields in the record value
          const recordValue = record.value as Record<string, unknown>
          const fieldValue = recordValue[key]
          
          if (fieldValue === undefined) {
            return false
          }
          
          // Convert to string for comparison
          const fieldStr = String(fieldValue)
          if (!fieldStr.includes(value)) {
            return false
          }
        }
      }
      
      return true
    })
  }, [data, parsedFilters])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Data Debugger</h1>

      {/* Top bar with controls */}
      <div className="mb-6 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          {/* Lexicon Dropdown */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <label htmlFor="lexicon" className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Lexicon:
            </label>
            <select
              id="lexicon"
              value={selectedLexicon}
              onChange={(e) => setSelectedLexicon(e.target.value)}
              className="flex-1 md:w-64 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a lexicon...</option>
              {lexicons.map((lexicon) => (
                <option key={lexicon} value={lexicon}>
                  {lexicon}
                </option>
              ))}
            </select>
          </div>

          {/* Privacy Checkbox */}
          <div className="flex items-center">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-4 h-4 text-blue-500 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Private Data</span>
            </label>
          </div>

          {/* Filter Input */}
          <div className="flex items-center gap-3 w-full md:flex-1">
            <label htmlFor="filter" className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
              Filter:
            </label>
            <input
              id="filter"
              type="text"
              value={filterText}
              onChange={(e) => handleFilterChange(e.target.value)}
              placeholder="key:value (e.g., note:hello rkey:abc123)"
              className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Show active filters */}
        {Object.keys(parsedFilters).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
            {Object.entries(parsedFilters).map(([key, value]) => (
              <span
                key={key}
                className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm"
              >
                <span className="font-medium">{key}:</span>
                <span className="ml-1">{value}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Data Display */}
      <div className="space-y-4">
        {!selectedLexicon && (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Select a Lexicon</h3>
            <p className="text-gray-600 dark:text-gray-400">Choose a lexicon from the dropdown to view records</p>
          </div>
        )}

        {isLoading && selectedLexicon && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading records...</p>
          </div>
        )}

        {error && selectedLexicon && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-red-500 dark:text-red-400 mr-2">⚠️</div>
              <div>
                <h3 className="text-red-800 dark:text-red-300 font-medium">Error loading records</h3>
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                  {error instanceof Error ? error.message : 'An unknown error occurred'}
                </p>
                <button
                  onClick={() => refetch()}
                  className="mt-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline text-sm"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {data && !isLoading && selectedLexicon && (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-600 dark:text-gray-400">
                {filteredRecords.length} of {('data' in data ? data.data.records : data.records)?.length || 0} record(s)
                {Object.keys(parsedFilters).length > 0 && ' (filtered)'}
              </p>
              <button
                onClick={() => refetch()}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline text-sm"
              >
                Refresh
              </button>
            </div>

            {filteredRecords && filteredRecords.length > 0 ? (
              <div className="space-y-4">
                {filteredRecords.map((record) => {
                  const rkey = record.uri?.split('/').pop() || 'unknown'
                  
                  return (
                    <div
                      key={record.uri}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700 text-left">
                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 text-left">
                            Record Key
                          </div>
                          <div className="text-sm font-mono text-gray-900 dark:text-gray-100 break-all text-left">
                            {rkey}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 text-left">
                            CID
                          </div>
                          <div className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all text-left">
                            {record.cid}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 text-left">
                            URI
                          </div>
                          <div className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all text-left">
                            {record.uri}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-left">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 text-left">
                          Value
                        </div>
                        <pre className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 rounded-md text-xs overflow-x-auto border border-gray-200 dark:border-gray-700 text-left whitespace-pre">
                          {JSON.stringify(record.value, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📭</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {Object.keys(parsedFilters).length > 0 ? 'No matching records' : 'No records found'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {Object.keys(parsedFilters).length > 0
                    ? 'Try adjusting your filters'
                    : `No records found for collection "${selectedLexicon}"`}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
