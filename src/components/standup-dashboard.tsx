'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, subDays } from 'date-fns'
import { useRouter, useSearchParams } from 'next/navigation'
import type { GitHubUser, CommitAuthor } from '@/lib/github-api'
import type { StandupSummary } from '@/lib/openai'


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
  const [standupSummaries, setStandupSummaries] = useState<StandupSummary[]>([])
  const [isGeneratingStandups, setIsGeneratingStandups] = useState(false)
  const [standupError, setStandupError] = useState<string | null>(null)
  
  const selectedDateObj = selectedDate ? new Date(selectedDate) : subDays(new Date(), 1)

  useEffect(() => {
    if (!selectedDate) {
      const yesterday = subDays(new Date(), 1)
      handleDateSelect(format(yesterday, 'yyyy-MM-dd'))
    }
  }, [selectedDate])

  useEffect(() => {
    if (selectedDate && members.length > 0) {
      generateStandupSummaries()
    }
  }, [selectedDate, members])

  const generateStandupSummaries = async () => {
    if (!selectedDate || isGeneratingStandups) return
    
    setIsGeneratingStandups(true)
    setStandupError(null)
    
    try {
      const response = await fetch('/api/standup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgName,
          date: selectedDate,
          users: members
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate standup summaries')
      }
      
      const data = await response.json()
      setStandupSummaries(data.summaries)
    } catch (error) {
      console.error('Error generating standup summaries:', error)
      setStandupError('Failed to generate AI summaries')
    } finally {
      setIsGeneratingStandups(false)
    }
  }

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

            {/* Daily Standup Summaries */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Daily Standup Summaries</h3>
                <button
                  onClick={generateStandupSummaries}
                  disabled={isGeneratingStandups}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isGeneratingStandups ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh AI Summaries
                    </>
                  )}
                </button>
              </div>
              
              {standupError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{standupError}</p>
                </div>
              )}
              
              {isGeneratingStandups && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">Generating AI-powered standup summaries...</p>
                </div>
              )}
              
              <div className="space-y-4">
                {standupSummaries.length > 0 ? (
                  standupSummaries.map((summary) => {
                    const member = members.find(m => m.login === summary.userLogin)
                    return (
                      <div key={summary.userLogin} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start gap-3">
                          <img
                            src={member?.avatar_url || `https://github.com/${summary.userLogin}.png`}
                            alt={summary.userLogin}
                            className="w-12 h-12 rounded-full"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-gray-900">{summary.userLogin}</h4>
                              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1h-6a1 1 0 01-1-1V8z" clipRule="evenodd" />
                              </svg>
                            </div>
                            
                            <div className="space-y-3">
                              <div>
                                <p className="text-sm text-gray-700">{summary.summary}</p>
                              </div>
                              
                              {summary.workDone.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-gray-500 mb-1">Work Completed:</p>
                                  <ul className="text-sm text-gray-700 space-y-1">
                                    {summary.workDone.map((item, index) => (
                                      <li key={index} className="flex items-start gap-2">
                                        <span className="text-green-500 mt-1">✓</span>
                                        <span>{item}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {summary.nextSteps.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-gray-500 mb-1">Next Steps:</p>
                                  <ul className="text-sm text-gray-700 space-y-1">
                                    {summary.nextSteps.map((item, index) => (
                                      <li key={index} className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-1">→</span>
                                        <span>{item}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {summary.blockers.length > 0 && (
                                <div>
                                  <p className="text-xs font-medium text-gray-500 mb-1">Blockers:</p>
                                  <ul className="text-sm text-gray-700 space-y-1">
                                    {summary.blockers.map((item, index) => (
                                      <li key={index} className="flex items-start gap-2">
                                        <span className="text-red-500 mt-1">⚠</span>
                                        <span>{item}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : uniqueAuthors.length > 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="mb-2">No AI summaries generated yet.</p>
                    <p className="text-sm">Click "Refresh AI Summaries" to generate standup summaries for team members who committed today.</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No commits found for this date.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}