'use client'

import { useState, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import 'react-day-picker/style.css'

interface CalendarDatePickerProps {
  selectedDate?: string
  onDateChange: (date: string) => void
  commitDates?: string[]
  label: string
}

export function CalendarDatePicker({ selectedDate, onDateChange, commitDates = [], label }: CalendarDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState<Date | undefined>(
    selectedDate ? new Date(selectedDate) : undefined
  )

  useEffect(() => {
    if (selectedDate) {
      setSelected(new Date(selectedDate))
    } else {
      setSelected(undefined)
    }
  }, [selectedDate])

  const handleDayClick = (day: Date | undefined) => {
    if (day) {
      onDateChange(format(day, 'yyyy-MM-dd'))
      setIsOpen(false)
    }
  }

  const commitDatesSet = new Set(commitDates)

  const modifiers = {
    hasCommits: (day: Date) => commitDatesSet.has(format(day, 'yyyy-MM-dd'))
  }

  const modifiersStyles = {
    hasCommits: {
      backgroundColor: '#10b981',
      color: 'white',
      fontWeight: 'bold'
    }
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white border px-3 py-2 text-left flex items-center justify-between"
        >
          <span className="text-gray-700">
            Go to date
          </span>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
      
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-1 bg-white rounded-md shadow-lg border border-gray-200">
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={handleDayClick}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              showOutsideDays={false}
              footer={
                <div className="text-xs text-gray-500 p-2 border-t">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-sm inline-block"></span>
                    <span>Days with commits</span>
                  </div>
                </div>
              }
            />
          </div>
        </>
      )}
    </div>
  )
}