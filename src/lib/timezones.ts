export interface Timezone {
  value: string;
  label: string;
  offset: string;
}

// Helper function to get dynamic offset for a timezone
function getTimezoneOffset(timezone: string): string {
  try {
    const now = new Date();
    // Use Intl.DateTimeFormat to get the offset
    const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
    const local = new Date(utc.toLocaleString('en-US', { timeZone: timezone }));
    const offsetMs = local.getTime() - utc.getTime();
    const offsetHours = Math.round(offsetMs / 3600000);
    
    const sign = offsetHours >= 0 ? '+' : '';
    const absHours = Math.abs(offsetHours);
    return `UTC${sign}${absHours.toString().padStart(2, '0')}:00`;
  } catch {
    return 'UTC±00:00';
  }
}

// List of IANA timezone identifiers that are well-supported by Intl
export const timezones: Timezone[] = [
  // Pacific
  { value: "Pacific/Honolulu", label: "Pacific/Honolulu", offset: getTimezoneOffset("Pacific/Honolulu") },
  
  // Americas
  { value: "America/Anchorage", label: "America/Anchorage", offset: getTimezoneOffset("America/Anchorage") },
  { value: "America/Los_Angeles", label: "America/Los_Angeles", offset: getTimezoneOffset("America/Los_Angeles") },
  { value: "America/Denver", label: "America/Denver", offset: getTimezoneOffset("America/Denver") },
  { value: "America/Chicago", label: "America/Chicago", offset: getTimezoneOffset("America/Chicago") },
  { value: "America/New_York", label: "America/New_York", offset: getTimezoneOffset("America/New_York") },
  { value: "America/Toronto", label: "America/Toronto", offset: getTimezoneOffset("America/Toronto") },
  { value: "America/Vancouver", label: "America/Vancouver", offset: getTimezoneOffset("America/Vancouver") },
  { value: "America/Halifax", label: "America/Halifax", offset: getTimezoneOffset("America/Halifax") },
  { value: "America/Sao_Paulo", label: "America/Sao_Paulo", offset: getTimezoneOffset("America/Sao_Paulo") },
  { value: "America/Buenos_Aires", label: "America/Buenos_Aires", offset: getTimezoneOffset("America/Buenos_Aires") },
  { value: "America/Mexico_City", label: "America/Mexico_City", offset: getTimezoneOffset("America/Mexico_City") },
  
  // Atlantic
  { value: "Atlantic/Azores", label: "Atlantic/Azores", offset: getTimezoneOffset("Atlantic/Azores") },
  
  // Europe
  { value: "Europe/London", label: "Europe/London", offset: getTimezoneOffset("Europe/London") },
  { value: "Europe/Dublin", label: "Europe/Dublin", offset: getTimezoneOffset("Europe/Dublin") },
  { value: "Europe/Paris", label: "Europe/Paris", offset: getTimezoneOffset("Europe/Paris") },
  { value: "Europe/Berlin", label: "Europe/Berlin", offset: getTimezoneOffset("Europe/Berlin") },
  { value: "Europe/Rome", label: "Europe/Rome", offset: getTimezoneOffset("Europe/Rome") },
  { value: "Europe/Madrid", label: "Europe/Madrid", offset: getTimezoneOffset("Europe/Madrid") },
  { value: "Europe/Amsterdam", label: "Europe/Amsterdam", offset: getTimezoneOffset("Europe/Amsterdam") },
  { value: "Europe/Stockholm", label: "Europe/Stockholm", offset: getTimezoneOffset("Europe/Stockholm") },
  { value: "Europe/Oslo", label: "Europe/Oslo", offset: getTimezoneOffset("Europe/Oslo") },
  { value: "Europe/Copenhagen", label: "Europe/Copenhagen", offset: getTimezoneOffset("Europe/Copenhagen") },
  { value: "Europe/Warsaw", label: "Europe/Warsaw", offset: getTimezoneOffset("Europe/Warsaw") },
  { value: "Europe/Prague", label: "Europe/Prague", offset: getTimezoneOffset("Europe/Prague") },
  { value: "Europe/Vienna", label: "Europe/Vienna", offset: getTimezoneOffset("Europe/Vienna") },
  { value: "Europe/Zurich", label: "Europe/Zurich", offset: getTimezoneOffset("Europe/Zurich") },
  { value: "Europe/Brussels", label: "Europe/Brussels", offset: getTimezoneOffset("Europe/Brussels") },
  { value: "Europe/Athens", label: "Europe/Athens", offset: getTimezoneOffset("Europe/Athens") },
  { value: "Europe/Helsinki", label: "Europe/Helsinki", offset: getTimezoneOffset("Europe/Helsinki") },
  { value: "Europe/Moscow", label: "Europe/Moscow", offset: getTimezoneOffset("Europe/Moscow") },
  { value: "Europe/Istanbul", label: "Europe/Istanbul", offset: getTimezoneOffset("Europe/Istanbul") },
  
  // Africa
  { value: "Africa/Cairo", label: "Africa/Cairo", offset: getTimezoneOffset("Africa/Cairo") },
  { value: "Africa/Johannesburg", label: "Africa/Johannesburg", offset: getTimezoneOffset("Africa/Johannesburg") },
  { value: "Africa/Lagos", label: "Africa/Lagos", offset: getTimezoneOffset("Africa/Lagos") },
  
  // Asia
  { value: "Asia/Dubai", label: "Asia/Dubai", offset: getTimezoneOffset("Asia/Dubai") },
  { value: "Asia/Tehran", label: "Asia/Tehran", offset: getTimezoneOffset("Asia/Tehran") },
  { value: "Asia/Karachi", label: "Asia/Karachi", offset: getTimezoneOffset("Asia/Karachi") },
  { value: "Asia/Kolkata", label: "Asia/Kolkata", offset: getTimezoneOffset("Asia/Kolkata") },
  { value: "Asia/Dhaka", label: "Asia/Dhaka", offset: getTimezoneOffset("Asia/Dhaka") },
  { value: "Asia/Bangkok", label: "Asia/Bangkok", offset: getTimezoneOffset("Asia/Bangkok") },
  { value: "Asia/Jakarta", label: "Asia/Jakarta", offset: getTimezoneOffset("Asia/Jakarta") },
  { value: "Asia/Singapore", label: "Asia/Singapore", offset: getTimezoneOffset("Asia/Singapore") },
  { value: "Asia/Shanghai", label: "Asia/Shanghai", offset: getTimezoneOffset("Asia/Shanghai") },
  { value: "Asia/Hong_Kong", label: "Asia/Hong_Kong", offset: getTimezoneOffset("Asia/Hong_Kong") },
  { value: "Asia/Manila", label: "Asia/Manila", offset: getTimezoneOffset("Asia/Manila") },
  { value: "Asia/Tokyo", label: "Asia/Tokyo", offset: getTimezoneOffset("Asia/Tokyo") },
  { value: "Asia/Seoul", label: "Asia/Seoul", offset: getTimezoneOffset("Asia/Seoul") },
  
  // Australia & Pacific
  { value: "Australia/Perth", label: "Australia/Perth", offset: getTimezoneOffset("Australia/Perth") },
  { value: "Australia/Adelaide", label: "Australia/Adelaide", offset: getTimezoneOffset("Australia/Adelaide") },
  { value: "Australia/Darwin", label: "Australia/Darwin", offset: getTimezoneOffset("Australia/Darwin") },
  { value: "Australia/Brisbane", label: "Australia/Brisbane", offset: getTimezoneOffset("Australia/Brisbane") },
  { value: "Australia/Sydney", label: "Australia/Sydney", offset: getTimezoneOffset("Australia/Sydney") },
  { value: "Australia/Melbourne", label: "Australia/Melbourne", offset: getTimezoneOffset("Australia/Melbourne") },
  { value: "Pacific/Auckland", label: "Pacific/Auckland", offset: getTimezoneOffset("Pacific/Auckland") },
  { value: "Pacific/Fiji", label: "Pacific/Fiji", offset: getTimezoneOffset("Pacific/Fiji") },
];

export function getTimezoneLabel(value: string): string {
  const tz = timezones.find(t => t.value === value);
  return tz ? `${tz.label} (${tz.offset})` : value;
}