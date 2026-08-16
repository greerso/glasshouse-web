export function isEmailAllowed(email: string, allowlist: string | undefined): boolean {
    if (!allowlist) return false;
    const allowed = allowlist.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    return allowed.includes(email.toLowerCase());
}
