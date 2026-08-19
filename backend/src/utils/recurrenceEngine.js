const { addDays, addWeeks, addMonths, addYears, startOfDay } = require('date-fns');

/**
 * Calculate the next occurrence date after a given date.
 */
function getNextOccurrence(recurrenceRule, afterDate) {
  if (!recurrenceRule || !recurrenceRule.frequency) return null;
  const { frequency, interval = 1, daysOfWeek, dayOfMonth, endDate } = recurrenceRule;
  const start = startOfDay(new Date(afterDate));

  if (endDate && start >= startOfDay(new Date(endDate))) {
    return null;
  }

  let next = null;
  switch (frequency.toLowerCase()) {
    case 'daily':
      next = addDays(start, interval);
      break;

    case 'weekly': {
      const targetDays = daysOfWeek && daysOfWeek.length > 0 ? daysOfWeek : [start.getDay()];
      let temp = addDays(start, 1);
      
      for (let i = 0; i < 7 * interval; i++) {
        if (targetDays.includes(temp.getDay())) {
          next = temp;
          break;
        }
        temp = addDays(temp, 1);
      }
      if (!next) {
        next = addWeeks(start, interval);
      }
      break;
    }

    case 'monthly': {
      const targetDay = dayOfMonth !== null && dayOfMonth !== undefined ? dayOfMonth : start.getDate();
      let temp = addMonths(start, interval);
      
      const daysInTargetMonth = new Date(temp.getFullYear(), temp.getMonth() + 1, 0).getDate();
      const finalDay = Math.min(targetDay, daysInTargetMonth);
      temp.setDate(finalDay);
      next = temp;
      break;
    }

    case 'yearly':
      next = addYears(start, interval);
      break;

    default:
      return null;
  }

  if (endDate && next && startOfDay(next) > startOfDay(new Date(endDate))) {
    return null;
  }

  return next;
}

module.exports = {
  getNextOccurrence
};
