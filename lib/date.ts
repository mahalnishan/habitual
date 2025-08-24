// Get start of today in UTC
export const startOfTodayUTC = (): Date => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
};

// Convert date to ISO string (date only, no time)
export const toISO = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Get each day of the last 52 weeks (370 days)
export const eachDayOfLast52Weeks = (): Date[] => {
  const days: Date[] = [];
  const today = startOfTodayUTC();
  
  for (let i = 369; i >= 0; i--) {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - i);
    days.push(date);
  }
  
  return days;
};

// Get week number for a date (0-52)
export const getWeekNumber = (date: Date): number => {
  const today = startOfTodayUTC();
  const diffTime = today.getTime() - date.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor((369 - diffDays) / 7);
};

// Get day of week (0-6, where 0 is Monday)
export const getDayOfWeek = (date: Date): number => {
  const day = date.getUTCDay();
  return day === 0 ? 6 : day - 1; // Convert Sunday=0 to Sunday=6, Monday=0
};
