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
    selectedDate ? new Date(selectedDate) : subDays(new Date(), 1)
  )

  useEffect(() => {
    if (!selectedDate) {
      const yesterday = subDays(new Date(), 1)
      setSelected(yesterday)
      onDateChange(format(yesterday, 'yyyy-MM-dd'))
    }
  }, [selectedDate, onDateChange])

  const handleDayClick = (day: Date | undefined) => {
    if (day) {
      setSelected(day)
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
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white border px-3 py-2 text-left"
      >
        {selected ? format(selected, 'MMM d, yyyy') : 'Select date'}
      </button>
      
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
                    <span className="w-4 h-4 bg-green-500 rounded-sm inline-block"></span>
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