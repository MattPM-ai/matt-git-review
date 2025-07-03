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
}

export function ActivityFilters({ members, selectedUser, selectedType, selectedDateFrom, selectedDateTo, commitDates = [] }: ActivityFiltersProps) {
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
      params.set('dateTo', date)
    } else {
      params.delete('dateFrom')
      params.delete('dateTo')
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <label htmlFor="user-filter" className="block text-sm font-medium text-gray-700 mb-2">
          Filter by User
        </label>
        <select
          id="user-filter"
          value={selectedUser || ''}
          onChange={(e) => handleUserFilter(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
        label="Select Date"
      />
    </div>
  )
}