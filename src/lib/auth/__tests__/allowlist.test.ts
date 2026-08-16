import { isEmailAllowed } from '../allowlist';

describe('isEmailAllowed', () => {
    it('allows listed emails case-insensitively', () => {
        expect(isEmailAllowed('Daniel@Example.com', 'daniel@example.com,x@y.z')).toBe(true);
    });

    it('fails closed when the allowlist is unset or empty', () => {
        expect(isEmailAllowed('daniel@example.com', undefined)).toBe(false);
        expect(isEmailAllowed('daniel@example.com', '')).toBe(false);
    });
});
