const PREFIX =
    /^(consideration of (the )?|approve |approval of |(1st|first|2nd|second) reading of )/i;

/** Resident-facing title: drop agenda numbering and ChampDS boilerplate. */
export function plainSubjectName(name: string): string {
    let s = name.trim();
    s = s.replace(/^\d+\.\s*/, '');
    s = s.replace(/^discussion item:\s*/i, '');
    for (let i = 0; i < 4; i++) {
        const next = s.replace(PREFIX, '').trim();
        if (next === s) break;
        s = next;
    }
    s = s.replace(/:+\s*$/g, '').trim();
    const cited = s.match(/^(ordinance|resolution)\s+\d{4}-\d+/i);
    if (cited) return cited[0];
    if (s.length > 0) {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }
    return s;
}

/** Last token — "Brian Stover" → "Stover". */
export function surnameOf(name: string): string {
    const parts = name.trim().split(/\s+/);
    return parts[parts.length - 1] ?? name;
}
