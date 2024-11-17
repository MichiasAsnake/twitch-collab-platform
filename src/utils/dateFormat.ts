import { formatDistanceToNow, isToday, isThisYear, format } from 'date-fns';

export const formatMessageDate = (dateString: string) => {
  try {
    if (!dateString) {
      return 'Just now';
    }

    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diff / (1000 * 60));
    
    if (isNaN(date.getTime())) {
      return 'Just now';
    }
    
    // If less than a minute, show "Just now"
    if (diffMinutes < 1) {
      return 'Just now';
    }
    
    // If less than an hour, show minutes
    if (diffMinutes < 60) {
      return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    // For same day, show time
    if (isToday(date)) {
      return format(date, 'h:mm a');
    }
    
    // For this year, show month, day and time
    if (isThisYear(date)) {
      return format(date, 'MMM d, h:mm a');
    }
    
    // For other years, include the year
    return format(date, 'MMM d, yyyy, h:mm a');
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Just now';
  }
}; 