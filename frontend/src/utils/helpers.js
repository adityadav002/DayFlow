import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Returns a human-readable due date string for display.
 * @param {string|Date|null} dateVal
 * @returns {{ text: string, isOverdue: boolean, isUrgent: boolean }}
 */
export function smartDueDate(dateVal) {
  if (!dateVal) return { text: 'No due date', isOverdue: false, isUrgent: false };

  const due = new Date(dateVal);
  if (isNaN(due.getTime())) return { text: 'Invalid date', isOverdue: false, isUrgent: false };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffMs = dueStart - todayStart;
  const diffDays = Math.round(diffMs / 86400000);

  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    const text = absDays === 1 ? 'Overdue by 1 day' : `Overdue by ${absDays} days`;
    return { text, isOverdue: true, isUrgent: true };
  }
  if (diffDays === 0) {
    // If hours remain, show them
    const hoursLeft = Math.round((due - now) / 3600000);
    if (hoursLeft > 0 && hoursLeft < 24) {
      return { text: `Due in ${hoursLeft}h`, isOverdue: false, isUrgent: true };
    }
    return { text: 'Due today', isOverdue: false, isUrgent: true };
  }
  if (diffDays === 1) return { text: 'Due tomorrow', isOverdue: false, isUrgent: false };
  if (diffDays < 7) return { text: `Due in ${diffDays} days`, isOverdue: false, isUrgent: false };

  // Format as "Aug 15"
  const month = due.toLocaleString('default', { month: 'short' });
  const day = due.getDate();
  return { text: `Due ${month} ${day}`, isOverdue: false, isUrgent: false };
}

