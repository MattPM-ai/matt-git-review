export interface Timezone {
  value: string;
  label: string;
  offset: string;
}

// Helper function to get dynamic offset for a timezone
function getTimezoneOffset(timezone: string): string {
  try {
    const now = new Date();
    
    // Create a date formatter for the specific timezone
    const formatter = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'longOffset'
    });
    
    // Get the formatted parts
    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find(part => part.type === 'timeZoneName');
    
    if (offsetPart && offsetPart.value.startsWith('GMT')) {
      // Convert GMT+1 to UTC+1 format (simple replacement)
      return offsetPart.value.replace('GMT', 'UTC');
    }
    
    // Fallback: Calculate manually
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const utcDate = new Date(utcTime);
    const localDate = new Date(utcDate.toLocaleString('en-US', { timeZone: timezone }));
    
    const offsetMs = localDate.getTime() - utcDate.getTime();
    const offsetMinutes = Math.round(offsetMs / 60000);
    const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
    const offsetMins = Math.abs(offsetMinutes) % 60;
    
    const sign = offsetMinutes >= 0 ? '+' : '-';
    
    // Format as UTC+1 or UTC-5 (no leading zeros, no minutes if zero)
    if (offsetMins === 0) {
      return `UTC${sign}${offsetHours}`;
    } else {
      return `UTC${sign}${offsetHours}:${offsetMins.toString().padStart(2, '0')}`;
    }
    
  } catch {
    return 'UTC+0';
  }
}

// Base timezone data without pre-calculated offsets
const baseTimezones = [
  // Pacific
  { value: "Pacific/Honolulu", label: "Pacific/Honolulu" },
  
  // Americas
  { value: "America/Anchorage", label: "America/Anchorage" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles" },
  { value: "America/Denver", label: "America/Denver" },
  { value: "America/Chicago", label: "America/Chicago" },
  { value: "America/New_York", label: "America/New_York" },
  { value: "America/Toronto", label: "America/Toronto" },
  { value: "America/Vancouver", label: "America/Vancouver" },
  { value: "America/Halifax", label: "America/Halifax" },
  { value: "America/Sao_Paulo", label: "America/Sao_Paulo" },
  { value: "America/Buenos_Aires", label: "America/Buenos_Aires" },
  { value: "America/Mexico_City", label: "America/Mexico_City" },
  
  // Atlantic
  { value: "Atlantic/Azores", label: "Atlantic/Azores" },
  
  // Europe
  { value: "Europe/London", label: "Europe/London" },
  { value: "Europe/Dublin", label: "Europe/Dublin" },
  { value: "Europe/Paris", label: "Europe/Paris" },
  { value: "Europe/Berlin", label: "Europe/Berlin" },
  { value: "Europe/Rome", label: "Europe/Rome" },
  { value: "Europe/Madrid", label: "Europe/Madrid" },
  { value: "Europe/Amsterdam", label: "Europe/Amsterdam" },
  { value: "Europe/Stockholm", label: "Europe/Stockholm" },
  { value: "Europe/Oslo", label: "Europe/Oslo" },
  { value: "Europe/Copenhagen", label: "Europe/Copenhagen" },
  { value: "Europe/Warsaw", label: "Europe/Warsaw" },
  { value: "Europe/Prague", label: "Europe/Prague" },
  { value: "Europe/Vienna", label: "Europe/Vienna" },
  { value: "Europe/Zurich", label: "Europe/Zurich" },
  { value: "Europe/Brussels", label: "Europe/Brussels" },
  { value: "Europe/Athens", label: "Europe/Athens" },
  { value: "Europe/Helsinki", label: "Europe/Helsinki" },
  { value: "Europe/Moscow", label: "Europe/Moscow" },
  { value: "Europe/Istanbul", label: "Europe/Istanbul" },
  
  // Africa
  { value: "Africa/Cairo", label: "Africa/Cairo" },
  { value: "Africa/Johannesburg", label: "Africa/Johannesburg" },
  { value: "Africa/Lagos", label: "Africa/Lagos" },
  
  // Asia
  { value: "Asia/Dubai", label: "Asia/Dubai" },
  { value: "Asia/Tehran", label: "Asia/Tehran" },
  { value: "Asia/Karachi", label: "Asia/Karachi" },
  { value: "Asia/Kolkata", label: "Asia/Kolkata" },
  { value: "Asia/Dhaka", label: "Asia/Dhaka" },
  { value: "Asia/Bangkok", label: "Asia/Bangkok" },
  { value: "Asia/Jakarta", label: "Asia/Jakarta" },
  { value: "Asia/Singapore", label: "Asia/Singapore" },
  { value: "Asia/Shanghai", label: "Asia/Shanghai" },
  { value: "Asia/Hong_Kong", label: "Asia/Hong_Kong" },
  { value: "Asia/Manila", label: "Asia/Manila" },
  { value: "Asia/Tokyo", label: "Asia/Tokyo" },
  { value: "Asia/Seoul", label: "Asia/Seoul" },
  
  // Australia & Pacific
  { value: "Australia/Perth", label: "Australia/Perth" },
  { value: "Australia/Adelaide", label: "Australia/Adelaide" },
  { value: "Australia/Darwin", label: "Australia/Darwin" },
  { value: "Australia/Brisbane", label: "Australia/Brisbane" },
  { value: "Australia/Sydney", label: "Australia/Sydney" },
  { value: "Australia/Melbourne", label: "Australia/Melbourne" },
  { value: "Pacific/Auckland", label: "Pacific/Auckland" },
  { value: "Pacific/Fiji", label: "Pacific/Fiji" },
];

// Function to get timezones with current offsets (calculated at runtime)
export function getTimezones(): Timezone[] {
  return baseTimezones.map(tz => ({
    ...tz,
    offset: getTimezoneOffset(tz.value)
  }));
}

// Export static list for backwards compatibility but recommend using getTimezones()
export const timezones: Timezone[] = getTimezones();

export function getTimezoneLabel(value: string): string {
  const tz = timezones.find(t => t.value === value);
  return tz ? `${tz.label} (${tz.offset})` : value;
}