"use client";

import { useState, useEffect, useRef } from "react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import "react-day-picker/style.css";
import { Calendar } from "lucide-react";

interface CalendarDatePickerProps {
  selectedDate?: string;
  onDateChange: (date: string) => void;
  commitDates?: string[];
  label: string;
}

export function CalendarDatePicker({
  selectedDate,
  onDateChange,
  commitDates = [],
  label,
}: CalendarDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<Date | undefined>(
    selectedDate ? new Date(selectedDate) : undefined
  );
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (selectedDate) {
      setSelected(new Date(selectedDate));
    } else {
      setSelected(undefined);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }
  }, [isOpen]);

  const handleDayClick = (day: Date | undefined) => {
    if (day) {
      onDateChange(format(day, "yyyy-MM-dd"));
      setIsOpen(false);
    }
  };

  const commitDatesSet = new Set(commitDates);

  const modifiers = {
    hasCommits: (day: Date) => commitDatesSet.has(format(day, "yyyy-MM-dd")),
  };

  const modifiersStyles = {
    hasCommits: {
      backgroundColor: "#c39553",
      color: "white",
      fontWeight: "bold",
    },
  };

  return (
    <div className="relative z-50">
      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="date-picker">
        {label}
      </label>
      <div className="flex gap-2">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className=" flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-left flex items-center justify-between hover:cursor-pointer px-3 py-1.5"
          id="date-picker"
          aria-label="Date picker"
          name="date-picker"
        >
          <span className="text-gray-700 text-sm">Go to date</span>
          <Calendar className="w-3.5 h-3.5 " />
        </button>
      </div>

       {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div 
            className="fixed z-50 mt-1 bg-white rounded-md shadow-lg border border-gray-200 px-3 py-1"
            style={{
              top: buttonRect ? `${buttonRect.bottom + 4}px` : undefined,
              left: buttonRect ? `${buttonRect.left}px` : undefined,
            }}
          >
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={handleDayClick}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              showOutsideDays={false}
              footer={
                <div className="text-xs p-2 border-t">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-600 rounded-sm inline-block"></span>
                    <span>Days with commits</span>
                  </div>
                </div>
              }
            />
          </div>
        </>
      )}
    </div>
  );
}
