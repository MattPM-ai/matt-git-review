"use client";

import { useState, useEffect, useRef } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  subWeeks,
  subMonths,
  subQuarters,
  subYears,
  addDays,
  isAfter,
} from "date-fns";

export type PeriodType = "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | "custom";

interface DateRange {
  dateFrom: string;
  dateTo: string;
}

interface DateRangePickerProps {
  period: PeriodType;
  dateFrom: string;
  dateTo: string;
  onPeriodChange: (period: PeriodType) => void;
  onDateRangeChange: (dateRange: DateRange) => void;
  className?: string;
  disabled?: boolean;
}

interface PeriodOption {
  value: PeriodType;
  label: string;
}

const PERIOD_OPTIONS: PeriodOption[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
  { value: "custom", label: "Custom Range" },
];

export function DateRangePicker({
  period,
  dateFrom,
  dateTo,
  onPeriodChange,
  onDateRangeChange,
  className = "",
  disabled = false,
}: DateRangePickerProps) {
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(dateFrom);
  const [customEndDate, setCustomEndDate] = useState(dateTo);
  
  const periodDropdownRef = useRef<HTMLDivElement>(null);
  const dateDropdownRef = useRef<HTMLDivElement>(null);
  const today = new Date();

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (periodDropdownRef.current && !periodDropdownRef.current.contains(event.target as Node)) {
        setIsPeriodDropdownOpen(false);
      }
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
        setIsDateDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Generate date range options based on period
  const generateDateRangeOptions = () => {
    const options: Array<{ label: string; dateFrom: string; dateTo: string }> = [];
    const currentDate = new Date();

    switch (period) {
      case "daily":
        // Show last 10 days
        for (let i = 0; i < 10; i++) {
          const date = addDays(currentDate, -i);
          const dateStr = format(date, "yyyy-MM-dd");
          options.push({
            label: format(date, "d MMM yyyy"),
            dateFrom: dateStr,
            dateTo: dateStr,
          });
        }
        break;

      case "weekly":
        // Show last 3 years of weeks (approximately 156 weeks)
        for (let i = 0; i < 156; i++) {
          const weekStart = startOfWeek(subWeeks(currentDate, i), { weekStartsOn: 1 });
          let weekEnd = endOfWeek(subWeeks(currentDate, i), { weekStartsOn: 1 });
          
          // Cap at today if week extends into future
          if (isAfter(weekEnd, today)) {
            weekEnd = today;
          }

          options.push({
            label: `${format(weekStart, "d MMM")} - ${format(weekEnd, "d MMM yyyy")}`,
            dateFrom: format(weekStart, "yyyy-MM-dd"),
            dateTo: format(weekEnd, "yyyy-MM-dd"),
          });
        }
        break;

      case "monthly":
        // Show last 3 years of months (36 months)
        for (let i = 0; i < 36; i++) {
          const monthStart = startOfMonth(subMonths(currentDate, i));
          let monthEnd = endOfMonth(subMonths(currentDate, i));
          
          // Cap at today if month extends into future
          if (isAfter(monthEnd, today)) {
            monthEnd = today;
          }

          options.push({
            label: `${format(monthStart, "d MMM")} - ${format(monthEnd, "d MMM yyyy")}`,
            dateFrom: format(monthStart, "yyyy-MM-dd"),
            dateTo: format(monthEnd, "yyyy-MM-dd"),
          });
        }
        break;

      case "quarterly":
        // Show last 3 years of quarters (12 quarters)
        for (let i = 0; i < 12; i++) {
          const quarterStart = startOfQuarter(subQuarters(currentDate, i));
          let quarterEnd = endOfQuarter(subQuarters(currentDate, i));
          
          // Cap at today if quarter extends into future
          if (isAfter(quarterEnd, today)) {
            quarterEnd = today;
          }

          options.push({
            label: `${format(quarterStart, "d MMM")} - ${format(quarterEnd, "d MMM yyyy")}`,
            dateFrom: format(quarterStart, "yyyy-MM-dd"),
            dateTo: format(quarterEnd, "yyyy-MM-dd"),
          });
        }
        break;

      case "yearly":
        // Show last 3 years
        for (let i = 0; i < 3; i++) {
          const yearStart = startOfYear(subYears(currentDate, i));
          let yearEnd = endOfYear(subYears(currentDate, i));
          
          // Cap at today if year extends into future
          if (isAfter(yearEnd, today)) {
            yearEnd = today;
          }

          options.push({
            label: `${format(yearStart, "d MMM")} - ${format(yearEnd, "d MMM yyyy")}`,
            dateFrom: format(yearStart, "yyyy-MM-dd"),
            dateTo: format(yearEnd, "yyyy-MM-dd"),
          });
        }
        break;

      case "custom":
        // For custom, we don't show a dropdown but direct date inputs
        return [];
    }

    return options;
  };

  const handlePeriodSelect = (newPeriod: PeriodType) => {
    onPeriodChange(newPeriod);
    setIsPeriodDropdownOpen(false);
    
    // Smart date range selection: find range that contains the previous end date
    if (newPeriod !== "custom") {
      // Generate options for the new period type
      const currentDate = new Date();
      const previousEndDate = new Date(dateTo);
      const options: Array<{ label: string; dateFrom: string; dateTo: string }> = [];

      switch (newPeriod) {
        case "daily":
          // For daily, just use the previous end date
          const dateStr = format(previousEndDate, "yyyy-MM-dd");
          options.push({
            label: format(previousEndDate, "d MMM yyyy"),
            dateFrom: dateStr,
            dateTo: dateStr,
          });
          break;

        case "weekly":
          // Find the week that contains the previous end date
          for (let i = 0; i < 156; i++) { // Look at up to 3 years of weeks to find the one containing previous end date
            const weekStart = startOfWeek(subWeeks(currentDate, i), { weekStartsOn: 1 });
            let weekEnd = endOfWeek(subWeeks(currentDate, i), { weekStartsOn: 1 });
            
            if (isAfter(weekEnd, today)) {
              weekEnd = today;
            }

            options.push({
              label: `${format(weekStart, "d MMM")} - ${format(weekEnd, "d MMM yyyy")}`,
              dateFrom: format(weekStart, "yyyy-MM-dd"),
              dateTo: format(weekEnd, "yyyy-MM-dd"),
            });

            // Check if this week contains the previous end date
            if (previousEndDate >= weekStart && previousEndDate <= weekEnd) {
              break; // Found the right week, stop here and use this as first option
            }
          }
          break;

        case "monthly":
          // Find the month that contains the previous end date
          for (let i = 0; i < 36; i++) { // Look at up to 3 years of months
            const monthStart = startOfMonth(subMonths(currentDate, i));
            let monthEnd = endOfMonth(subMonths(currentDate, i));
            
            if (isAfter(monthEnd, today)) {
              monthEnd = today;
            }

            options.push({
              label: `${format(monthStart, "d MMM")} - ${format(monthEnd, "d MMM yyyy")}`,
              dateFrom: format(monthStart, "yyyy-MM-dd"),
              dateTo: format(monthEnd, "yyyy-MM-dd"),
            });

            // Check if this month contains the previous end date
            if (previousEndDate >= monthStart && previousEndDate <= monthEnd) {
              break; // Found the right month
            }
          }
          break;

        case "quarterly":
          // Find the quarter that contains the previous end date
          for (let i = 0; i < 12; i++) { // Look at up to 3 years of quarters
            const quarterStart = startOfQuarter(subQuarters(currentDate, i));
            let quarterEnd = endOfQuarter(subQuarters(currentDate, i));
            
            if (isAfter(quarterEnd, today)) {
              quarterEnd = today;
            }

            options.push({
              label: `${format(quarterStart, "d MMM")} - ${format(quarterEnd, "d MMM yyyy")}`,
              dateFrom: format(quarterStart, "yyyy-MM-dd"),
              dateTo: format(quarterEnd, "yyyy-MM-dd"),
            });

            // Check if this quarter contains the previous end date
            if (previousEndDate >= quarterStart && previousEndDate <= quarterEnd) {
              break; // Found the right quarter
            }
          }
          break;

        case "yearly":
          // Find the year that contains the previous end date
          for (let i = 0; i < 3; i++) { // Look at up to 3 years
            const yearStart = startOfYear(subYears(currentDate, i));
            let yearEnd = endOfYear(subYears(currentDate, i));
            
            if (isAfter(yearEnd, today)) {
              yearEnd = today;
            }

            options.push({
              label: `${format(yearStart, "d MMM")} - ${format(yearEnd, "d MMM yyyy")}`,
              dateFrom: format(yearStart, "yyyy-MM-dd"),
              dateTo: format(yearEnd, "yyyy-MM-dd"),
            });

            // Check if this year contains the previous end date
            if (previousEndDate >= yearStart && previousEndDate <= yearEnd) {
              break; // Found the right year
            }
          }
          break;
      }

      if (options.length > 0) {
        onDateRangeChange({
          dateFrom: options[0].dateFrom,
          dateTo: options[0].dateTo,
        });
      }
    }
  };

  const handleDateRangeSelect = (range: { dateFrom: string; dateTo: string }) => {
    onDateRangeChange(range);
    setIsDateDropdownOpen(false);
  };

  const handleCustomDateChange = () => {
    // Validate that start date is not after end date
    const start = new Date(customStartDate);
    const end = new Date(customEndDate);
    
    if (isAfter(start, end)) {
      return; // Don't update if invalid range
    }

    // Cap end date at today if it's in the future
    const cappedEnd = isAfter(end, today) ? today : end;
    
    onDateRangeChange({
      dateFrom: customStartDate,
      dateTo: format(cappedEnd, "yyyy-MM-dd"),
    });
  };

  const currentPeriodLabel = PERIOD_OPTIONS.find(opt => opt.value === period)?.label || "Select Period";
  const dateRangeOptions = generateDateRangeOptions();
  
  // Format current date range for display
  const formatCurrentRange = () => {
    if (period === "custom") {
      return `${format(new Date(dateFrom), "d MMM yyyy")} - ${format(new Date(dateTo), "d MMM yyyy")}`;
    }
    
    const currentOption = dateRangeOptions.find(
      opt => opt.dateFrom === dateFrom && opt.dateTo === dateTo
    );
    
    return currentOption?.label || `${format(new Date(dateFrom), "d MMM yyyy")} - ${format(new Date(dateTo), "d MMM yyyy")}`;
  };

  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${className}`}>
      {/* Period Selector Dropdown */}
      <div className="relative" ref={periodDropdownRef}>
        <button
          onClick={() => !disabled && setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
          disabled={disabled}
          className={`flex items-center justify-between w-full sm:w-auto px-3 py-2 text-sm border border-gray-300 rounded-lg transition-colors min-w-32 ${
            disabled 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-white hover:bg-gray-50'
          }`}
        >
          <span>{currentPeriodLabel}</span>
          <svg
            className={`w-4 h-4 ml-2 transition-transform ${isPeriodDropdownOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isPeriodDropdownOpen && !disabled && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-48">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handlePeriodSelect(option.value)}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                  period === option.value ? 'bg-blue-50 text-blue-600' : ''
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Date Range Selector */}
      {period === "custom" ? (
        // Custom Date Range Inputs
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customStartDate}
            onChange={(e) => setCustomStartDate(e.target.value)}
            onBlur={handleCustomDateChange}
            max={format(today, "yyyy-MM-dd")}
            disabled={disabled}
            className={`px-3 py-2 text-sm border border-gray-300 rounded-lg ${
              disabled 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            }`}
          />
          <span className="text-gray-500 text-sm">to</span>
          <input
            type="date"
            value={customEndDate}
            onChange={(e) => setCustomEndDate(e.target.value)}
            onBlur={handleCustomDateChange}
            min={customStartDate}
            max={format(today, "yyyy-MM-dd")}
            disabled={disabled}
            className={`px-3 py-2 text-sm border border-gray-300 rounded-lg ${
              disabled 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            }`}
          />
        </div>
      ) : period === "daily" ? (
        // Simple Date Picker for Daily
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateRangeChange({ dateFrom: e.target.value, dateTo: e.target.value })}
          max={format(today, "yyyy-MM-dd")}
          disabled={disabled}
          className={`px-3 py-2 text-sm border border-gray-300 rounded-lg ${
            disabled 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          }`}
        />
      ) : (
        // Dropdown for Other Periods
        <div className="relative flex-1" ref={dateDropdownRef}>
          <button
            onClick={() => !disabled && setIsDateDropdownOpen(!isDateDropdownOpen)}
            disabled={disabled}
            className={`flex items-center justify-between w-full px-3 py-2 text-sm border border-gray-300 rounded-lg transition-colors ${
              disabled 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            <span className="truncate">{formatCurrentRange()}</span>
            <svg
              className={`w-4 h-4 ml-2 flex-shrink-0 transition-transform ${isDateDropdownOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isDateDropdownOpen && !disabled && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
              {dateRangeOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleDateRangeSelect({ dateFrom: option.dateFrom, dateTo: option.dateTo })}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                    option.dateFrom === dateFrom && option.dateTo === dateTo ? 'bg-blue-50 text-blue-600' : ''
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}