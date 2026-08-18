const CIVIL = /^(\d{4})-(\d{2})-(\d{2})$/;

export function formatCivilDate(ymd: string, locale: string): string {
    const m = CIVIL.exec(ymd);
    if (!m) throw new Error(`not a civil date: ${ymd}`);
    const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12));
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
