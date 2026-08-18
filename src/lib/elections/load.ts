import ts2026 from '@/content/elections/thompsons-station-2026-11.json';
import { parseElectionFile, type ElectionFile } from './schema';

const FILES: Record<string, unknown> = {
    'thompsons-station': ts2026,
};

export function loadElection(cityId: string): ElectionFile | null {
    const raw = FILES[cityId];
    if (!raw) return null;
    const file = parseElectionFile(raw);
    if (file.cityId !== cityId) return null;
    return file;
}
