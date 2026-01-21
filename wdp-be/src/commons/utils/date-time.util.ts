export class DateTimeUtils {
  static getCurrentUnixTimestamp(): number {
    return Math.floor(Date.now() / 1000);
  }

  static convertUnixTimestampToDate(unixTimestamp: number): Date {
    return new Date(unixTimestamp * 1000);
  }

  static convertDateToUnixTimestamp(date: Date): number {
    return Math.floor(date.getTime() / 1000);
  }

  static toMinutes = (t: Date | string | number): number => {
    if (typeof t === 'number') return t;
    if (t instanceof Date) return t.getHours() * 60 + t.getMinutes();
    const parts = (t || '').split(':').map((p) => parseInt(p, 10));
    const hours = Number.isFinite(parts[0]) ? parts[0] : 0;
    const minutes = Number.isFinite(parts[1]) ? parts[1] : 0;
    return hours * 60 + minutes;
  };

  static toDateTimestamp = (d: Date | string): number => {
    const date = d instanceof Date ? d : new Date(d);
    const normalized = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    return normalized.getTime();
  };
}
