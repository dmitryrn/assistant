export function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const duration: string[] = [];

  if (hours > 0) {
    let unit = 'hours';
    if (hours === 1) {
      unit = 'hour';
    }
    duration.push(`${hours} ${unit}`);
  }

  if (remainingMinutes > 0 || duration.length === 0) {
    let unit = 'minutes';
    if (remainingMinutes === 1) {
      unit = 'minute';
    }
    duration.push(`${remainingMinutes} ${unit}`);
  }

  return `in ${duration.join(' ')}`;
}

export function getAlarmCountdown(hour: number, minute: number, now: Date): string {
  const alarmTime = new Date(now);
  alarmTime.setHours(hour, minute, 0, 0);

  if (alarmTime.getTime() <= now.getTime()) {
    alarmTime.setDate(alarmTime.getDate() + 1);
  }

  const minutesUntilAlarm = Math.ceil((alarmTime.getTime() - now.getTime()) / 60_000);
  return formatDuration(minutesUntilAlarm);
}
