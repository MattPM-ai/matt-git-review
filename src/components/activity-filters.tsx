'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { CalendarDatePicker } from './calendar-date-picker'
import type { GitHubUser } from '@/lib/github-api'


interface ActivityFiltersProps {
  members: GitHubUser[]
  selectedUser?: string
  selectedType?: string
  selectedDateFrom?: string
  selectedDateTo?: string
  commitDates?: string[]
  allActivities?: any[]
}

export function ActivityFilters({ 
  members, 
  selectedUser, 
  selectedType, 
  selectedDateFrom, 
  selectedDateTo, 
  commitDates = [],
  allActivities = []
}: ActivityFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleUserFilter = (user: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (user) {
      params.set('user', user)
    } else {
      params.delete('user')
    }
    router.push(`?${params.toString()}`)
  }

  const handleTypeFilter = (type: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (type) {
      params.set('type', type)
    } else {
      params.delete('type')
    }
    router.push(`?${params.toString()}`)
  }

  const handleDateFilter = (date: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (date) {
      params.set('dateFrom', date)
    } else {
      params.delete('dateFrom')
    }
    
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        <p className="text-sm text-gray-600 mb-4">
          Filter activity by user, type, or date
        </p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="space-y-4">
          <div>
            <label htmlFor="user-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by User
            </label>
            <select
              id="user-filter"
              value={selectedUser || ''}
              onChange={(e) => handleUserFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="">All Users</option>
              {members.map((member) => (
                <option key={member.id} value={member.login}>
                  {member.login}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Type
            </label>
            <select
              id="type-filter"
              value={selectedType || ''}
              onChange={(e) => handleTypeFilter(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              <option value="">All Types</option>
              <option value="commits">Commits</option>
              <option value="issues">Issues</option>
              <option value="pulls">Pull Requests</option>
            </select>
          </div>

          <CalendarDatePicker
            selectedDate={selectedDateFrom}
            onDateChange={handleDateFilter}
            commitDates={commitDates}
            label="Go to Date"
          />
        </div>
      </div>

      {/* Activity Stats */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Activity Stats</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Items:</span>
            <span className="font-medium">{allActivities.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Commits:</span>
            <span className="font-medium">{allActivities.filter(a => a.type === 'commits').length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Issues:</span>
            <span className="font-medium">{allActivities.filter(a => a.type === 'issues').length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Pull Requests:</span>
            <span className="font-medium">{allActivities.filter(a => a.type === 'pulls').length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}