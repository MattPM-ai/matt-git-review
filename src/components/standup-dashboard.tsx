'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, subDays } from 'date-fns'
import { useRouter, useSearchParams } from 'next/navigation'
import type { GitHubUser, CommitAuthor } from '@/lib/github-api'


interface StandupDashboardProps {
  members: GitHubUser[]
  commitDates: string[]
  selectedDate?: string
  orgName: string
  dailyCommitAuthors?: Record<string, CommitAuthor[]>
}

export function StandupDashboard({ 
  members, 
  commitDates = [], 
  selectedDate,
  orgName,
  dailyCommitAuthors = {}
}: StandupDashboardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  const selectedDateObj = selectedDate ? new Date(selectedDate) : subDays(new Date(), 1)

  useEffect(() => {
    if (!selectedDate) {
      const yesterday = subDays(new Date(), 1)
      handleDateSelect(format(yesterday, 'yyyy-MM-dd'))
    }
  }, [selectedDate])

  const handleDateSelect = (date: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('dateFrom', date)
    params.set('dateTo', date)
    router.push(`?${params.toString()}`)
  }

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  const startingDayOfWeek = getDay(monthStart)
  const leadingEmptyDays = Array(startingDayOfWeek).fill(null)

  const commitDatesSet = new Set(commitDates)
  
  const todaysAuthors = dailyCommitAuthors[format(selectedDateObj, 'yyyy-MM-dd')] || []
  const uniqueAuthors = Array.from(new Map(todaysAuthors.map(author => [author.login, author])).values())
  const completedCount = uniqueAuthors.length
  const totalCount = members.length

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Standup</h1>
        <p className="text-gray-600 mt-1">
          {orgName} • {format(selectedDateObj, 'EEEE, MMMM d, yyyy')}
        </p>
        <div className="flex items-center justify-between mt-4">
          <div>
            <span className="text-sm text-gray-500">Standup Progress</span>
            <p className="text-2xl font-bold text-gray-900">{completedCount}/{totalCount} Complete</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{format(currentMonth, 'MMMM yyyy')}</h2>
              <div className="flex gap-2">
                <button
                  onClick={handlePreviousMonth}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {leadingEmptyDays.map((_, index) => (
                <div key={`empty-${index}`} className="h-10" />
              ))}
              {monthDays.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const hasCommits = commitDatesSet.has(dateStr)
                const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDateObj, 'yyyy-MM-dd')
                const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                
                return (
                  <button
                    key={dateStr}
                    onClick={() => handleDateSelect(dateStr)}
                    className={`
                      h-10 rounded-lg flex items-center justify-center text-sm font-medium
                      transition-colors relative
                      ${isSelected 
                        ? 'bg-blue-600 text-white' 
                        : isToday
                        ? 'bg-gray-200 text-gray-900'
                        : 'hover:bg-gray-100 text-gray-700'
                      }
                    `}
                  >
                    {format(day, 'd')}
                    {hasCommits && !isSelected && (
                      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-green-500 rounded-full" />
                    )}
                  </button>
                )
              })}
            </div>

            <div className="mt-4 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Days with commits</span>
              </div>
            </div>
          </div>

          {/* Today's Standup Status */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Today's Standup Status</h3>
            <div className="space-y-3">
              {members.map(member => {
                const hasCommitted = uniqueAuthors.some(author => author.login === member.login)
                return (
                  <div key={member.id} className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={member.avatar_url}
                        alt={member.login}
                        className="w-10 h-10 rounded-full"
                      />
                      {hasCommitted && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{member.login}</p>
                      <p className="text-sm text-gray-500">Developer</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">
                Completed: <span className="font-bold text-gray-900">{completedCount}/{totalCount}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Sprint Progress Section */}
        <div className="lg:col-span-2">
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Sprint Progress</h2>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-3xl font-bold text-blue-600">65%</span>
                <span className="text-sm text-gray-500">Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="bg-blue-600 h-3 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>

            {/* Team Overview */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Team Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {uniqueAuthors.slice(0, 4).map((author, index) => (
                  <div key={author.login} className="bg-white rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <img
                        src={author.avatar_url || `https://github.com/${author.login}.png`}
                        alt={author.login}
                        className="w-12 h-12 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">{author.name || author.login}</h4>
                          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-500">Developer</p>
                        
                        <div className="mt-3 space-y-2">
                          <div>
                            <p className="text-xs font-medium text-gray-500">Current Task</p>
                            <p className="text-sm text-gray-900">View commit history for details</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}