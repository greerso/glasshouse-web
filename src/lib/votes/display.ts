/** Resident-facing title: drop agenda boilerplate, keep the substance. */
export function plainSubjectName(name: string): string {
    return name
        .replace(/^(consideration of (the )?|approve |approval of |2nd reading of |second reading of )/i, '')
        .replace(/:+\s*$/g, '')
        .trim();
}

/** Last token — "Brian Stover" → "Stover". */
export function surnameOf(name: string): string {
    const parts = name.trim().split(/\s+/);
    return parts[parts.length - 1] ?? name;
}
