/**
 * Unified date formatting utility for MedHelp i18n
 */

export const formatIsoDate = (isoString, type = 'short', t) => {
  if (!isoString) return '';
  
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString; // Fallback to raw string if invalid

  const day = date.getDate();
  const monthIndex = date.getMonth();
  const dayIndex = date.getDay();
  const year = date.getFullYear();
  
  const monthKeys = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const fullMonthKeys = ["january", "february", "march", "april", "may_full", "june", "july", "august", "september", "october", "november", "december"];
  const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const fullDayKeys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

  switch (type) {
    case 'day':
      return day.toString();
    case 'month':
      return t(`common.months.${monthKeys[monthIndex]}`);
    case 'monthFull':
      return t(`common.months.${fullMonthKeys[monthIndex]}`);
    case 'weekday':
      return t(`common.days.${dayKeys[dayIndex]}`);
    case 'weekdayFull':
      return t(`common.days.${fullDayKeys[dayIndex]}`);
    case 'short': // "18 Feb"
      return `${day} ${t(`common.months.${monthKeys[monthIndex]}`)}`;
    case 'full': // "18 February 2026"
      return `${day} ${t(`common.months.${fullMonthKeys[monthIndex]}`)} ${year}`;
    case 'time': // "17:30"
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    default:
      return date.toLocaleDateString();
  }
};

/**
 * Helper to get ISO date with offset in days
 */
export const getIsoDateWithOffset = (daysOffset = 0, hour = 0, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};
