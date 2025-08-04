export interface Timezone {
  value: number;
  label: string;
  offset: string;
}

export const timezones: Timezone[] = [
  { value: -12, label: "Pacific/Kwajalein", offset: "UTC-12:00" },
  { value: -11, label: "Pacific/Samoa", offset: "UTC-11:00" },
  { value: -10, label: "Pacific/Honolulu", offset: "UTC-10:00" },
  { value: -9.5, label: "Pacific/Marquesas", offset: "UTC-09:30" },
  { value: -9, label: "America/Anchorage", offset: "UTC-09:00" },
  { value: -8, label: "America/Los_Angeles", offset: "UTC-08:00" },
  { value: -7, label: "America/Denver", offset: "UTC-07:00" },
  { value: -6, label: "America/Chicago", offset: "UTC-06:00" },
  { value: -5, label: "America/New_York", offset: "UTC-05:00" },
  { value: -4.5, label: "America/Caracas", offset: "UTC-04:30" },
  { value: -4, label: "America/Halifax", offset: "UTC-04:00" },
  { value: -3.5, label: "America/St_Johns", offset: "UTC-03:30" },
  { value: -3, label: "America/Sao_Paulo", offset: "UTC-03:00" },
  { value: -2, label: "Atlantic/South_Georgia", offset: "UTC-02:00" },
  { value: -1, label: "Atlantic/Azores", offset: "UTC-01:00" },
  { value: 0, label: "Europe/London", offset: "UTC±00:00" },
  { value: 1, label: "Europe/Paris", offset: "UTC+01:00" },
  { value: 2, label: "Europe/Athens", offset: "UTC+02:00" },
  { value: 3, label: "Europe/Moscow", offset: "UTC+03:00" },
  { value: 3.5, label: "Asia/Tehran", offset: "UTC+03:30" },
  { value: 4, label: "Asia/Dubai", offset: "UTC+04:00" },
  { value: 4.5, label: "Asia/Kabul", offset: "UTC+04:30" },
  { value: 5, label: "Asia/Karachi", offset: "UTC+05:00" },
  { value: 5.5, label: "Asia/Kolkata", offset: "UTC+05:30" },
  { value: 5.75, label: "Asia/Kathmandu", offset: "UTC+05:45" },
  { value: 6, label: "Asia/Dhaka", offset: "UTC+06:00" },
  { value: 6.5, label: "Asia/Yangon", offset: "UTC+06:30" },
  { value: 7, label: "Asia/Bangkok", offset: "UTC+07:00" },
  { value: 8, label: "Asia/Singapore", offset: "UTC+08:00" },
  { value: 8.75, label: "Australia/Eucla", offset: "UTC+08:45" },
  { value: 9, label: "Asia/Tokyo", offset: "UTC+09:00" },
  { value: 9.5, label: "Australia/Darwin", offset: "UTC+09:30" },
  { value: 10, label: "Australia/Sydney", offset: "UTC+10:00" },
  { value: 10.5, label: "Australia/Lord_Howe", offset: "UTC+10:30" },
  { value: 11, label: "Pacific/Noumea", offset: "UTC+11:00" },
  { value: 12, label: "Pacific/Auckland", offset: "UTC+12:00" },
  { value: 12.75, label: "Pacific/Chatham", offset: "UTC+12:45" },
  { value: 13, label: "Pacific/Tongatapu", offset: "UTC+13:00" },
  { value: 14, label: "Pacific/Kiritimati", offset: "UTC+14:00" },
];

export function getTimezoneLabel(value: number): string {
  const tz = timezones.find(t => t.value === value);
  return tz ? `${tz.label} (${tz.offset})` : `UTC${value >= 0 ? '+' : ''}${value}:00`;
}