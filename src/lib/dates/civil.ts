const CIVIL = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad2(n: number): string {
    return String(n).padStart(2, '0');
}

function parseCivil(ymd: string): { year: number; month: number; day: number } {
    const m = CIVIL.exec(ymd);
    if (!m) throw new Error(`not a civil date: ${ymd}`);
    return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

function zoneParts(
    utcMs: number,
    timeZone: string,
): {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
} {
    const dtf = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
    });
    const map: Record<string, string> = {};
    for (const part of dtf.formatToParts(new Date(utcMs))) {
        if (part.type !== 'literal') map[part.type] = part.value;
    }
    return {
        year: Number(map.year),
        month: Number(map.month),
        day: Number(map.day),
        hour: Number(map.hour),
        minute: Number(map.minute),
        second: Number(map.second),
    };
}

function zoneOffsetMs(utcMs: number, timeZone: string): number {
    const p = zoneParts(utcMs, timeZone);
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - utcMs;
}

function midnightUtcInZone(ymd: string, timeZone: string): number {
    const { year, month, day } = parseCivil(ymd);
    const asUtc = Date.UTC(year, month - 1, day, 0, 0, 0);
    let utc = asUtc - zoneOffsetMs(asUtc, timeZone);
    utc = asUtc - zoneOffsetMs(utc, timeZone);
    return utc;
}

export function civilDayBounds(ymd: string, timeZone: string): { from: Date; toExclusive: Date } {
    const { year, month, day } = parseCivil(ymd);
    const fromMs = midnightUtcInZone(ymd, timeZone);
    const next = new Date(Date.UTC(year, month - 1, day + 1));
    const nextYmd = `${next.getUTCFullYear()}-${pad2(next.getUTCMonth() + 1)}-${pad2(next.getUTCDate())}`;
    const toExclusiveMs = midnightUtcInZone(nextYmd, timeZone);
    return { from: new Date(fromMs), toExclusive: new Date(toExclusiveMs) };
}

export function formatCivilDate(ymd: string, locale: string): string {
    const { year, month, day } = parseCivil(ymd);
    const date = new Date(Date.UTC(year, month - 1, day, 12));
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
    }).format(date);
}

export function formatOffsetInZone(iso: string, timeZone: string, locale: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) throw new Error(`not an instant: ${iso}`);
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : locale, {
        dateStyle: 'long',
        timeStyle: 'short',
        timeZone,
    }).format(date);
}
