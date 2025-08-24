'use client';

import { useState } from 'react';
import { eachDayOfLast52Weeks, getWeekNumber, getDayOfWeek, toISO } from '@/lib/date';

interface HeatmapProps {
  entries: Record<string, number>;
  selectedHabitId?: string;
  onCellClick?: (date: string) => void;
}

const Heatmap = ({ entries, selectedHabitId, onCellClick }: HeatmapProps) => {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const days = eachDayOfLast52Weeks();
  
  // Create 7x53 grid (7 days x 53 weeks)
  const grid: (Date | null)[][] = Array.from({ length: 7 }, () => Array(53).fill(null));
  
  // Fill grid with dates
  days.forEach(day => {
    const weekNum = getWeekNumber(day);
    const dayOfWeek = getDayOfWeek(day);
    if (weekNum < 53 && dayOfWeek < 7) {
      grid[dayOfWeek][weekNum] = day;
    }
  });
  
  // Get color based on entry count
  const getColor = (count: number): string => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (count === 1) return 'bg-green-200 dark:bg-green-900';
    if (count === 2) return 'bg-green-400 dark:bg-green-700';
    if (count === 3) return 'bg-green-600 dark:bg-green-500';
    return 'bg-green-800 dark:bg-green-300';
  };
  
  // Get entry count for a date
  const getEntryCount = (date: Date): number => {
    const isoDate = toISO(date);
    return entries[isoDate] || 0;
  };
  
  // Handle cell click
  const handleCellClick = (date: Date) => {
    if (selectedHabitId && onCellClick) {
      onCellClick(toISO(date));
    }
  };
  
  // Get tooltip text
  const getTooltipText = (date: Date, count: number): string => {
    const formattedDate = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    if (count === 0) return `${formattedDate}: No entries`;
    if (count === 1) return `${formattedDate}: 1 entry`;
    return `${formattedDate}: ${count} entries`;
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Habit Heatmap
        </h2>
        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
          <span>Less</span>
          <div className="flex space-x-1">
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800"></div>
            <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900"></div>
            <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-700"></div>
            <div className="w-3 h-3 rounded-sm bg-green-600 dark:bg-green-500"></div>
            <div className="w-3 h-3 rounded-sm bg-green-800 dark:bg-green-300"></div>
          </div>
          <span>More</span>
        </div>
      </div>
      
      {/* Heatmap Grid */}
      <div className="relative">
        {/* Day labels */}
        <div className="flex mb-2">
          <div className="w-8"></div>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
            <div key={day} className="w-3 text-xs text-gray-500 dark:text-gray-400 text-center">
              {day}
            </div>
          ))}
        </div>
        
        {/* Grid */}
        <div className="flex">
          {/* Week labels */}
          <div className="flex flex-col space-y-1 mr-2">
            {Array.from({ length: 53 }, (_, i) => (
              <div key={i} className="h-3 text-xs text-gray-500 dark:text-gray-400 text-right leading-3">
                {i % 4 === 0 ? i : ''}
              </div>
            ))}
          </div>
          
          {/* Heatmap cells */}
          <div className="grid grid-cols-53 gap-1">
            {Array.from({ length: 7 }, (_, row) =>
              Array.from({ length: 53 }, (_, col) => {
                const date = grid[row][col];
                if (!date) return <div key={`${row}-${col}`} className="w-3 h-3" />;
                
                const count = getEntryCount(date);
                const isClickable = selectedHabitId && onCellClick;
                const isToday = toISO(date) === toISO(new Date());
                
                return (
                  <div
                    key={`${row}-${col}`}
                    className={`
                      w-3 h-3 rounded-sm border border-transparent
                      ${getColor(count)}
                      ${isClickable ? 'cursor-pointer hover:scale-110 transition-transform' : ''}
                      ${isToday ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-900' : ''}
                    `}
                    onClick={() => isClickable && handleCellClick(date)}
                    onMouseEnter={() => setHoveredDate(toISO(date))}
                    onMouseLeave={() => setHoveredDate(null)}
                    role={isClickable ? 'button' : undefined}
                    tabIndex={isClickable ? 0 : undefined}
                    aria-label={getTooltipText(date, count)}
                    onKeyDown={(e) => {
                      if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        handleCellClick(date);
                      }
                    }}
                  />
                );
              })
            )}
          </div>
        </div>
        
        {/* Tooltip */}
        {hoveredDate && (
          <div className="absolute z-10 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg pointer-events-none">
            {getTooltipText(new Date(hoveredDate), entries[hoveredDate] || 0)}
          </div>
        )}
      </div>
      
      {/* Instructions */}
      {selectedHabitId && onCellClick && (
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 text-center">
          Click on any cell to toggle your habit for that day
        </p>
      )}
    </div>
  );
};

export default Heatmap;
