import { chooseVotes } from './choose';
import { isSplit } from './split';
import type { VotedSubject, VoteType } from './types';

export type AgreementPerson = {
    personId: string;
    name: string;
    namedCount: number; // n
};

export type PairCell = {
    aId: string;
    bId: string;
    agreed: number;
    both: number;
};

export type AgreementModel = {
    namedItems: number;
    unanimousCount: number;
    splitCount: number;
    dateFrom: Date | null;
    dateTo: Date | null;
    people: AgreementPerson[]; // role holders; namedCount may be 0
    pairs: PairCell[];         // only people with namedCount > 0
    splits: VotedSubject[];
};

export function buildAgreement(
    namedSubjects: VotedSubject[],
    roster: { personId: string; name: string }[],
): AgreementModel {
    const namedItems = namedSubjects.length;
    const votesByPerson = new Map<string, Map<string, VoteType>>();
    const splits: VotedSubject[] = [];
    let unanimousCount = 0;
    let dateFrom: Date | null = null;
    let dateTo: Date | null = null;

    for (const subject of namedSubjects) {
        const chosen = chooseVotes(subject.votes);
        if (isSplit(chosen, subject.result)) {
            splits.push(subject);
        } else {
            unanimousCount += 1;
        }

        const when = subject.meetingDateTime;
        if (dateFrom === null || when < dateFrom) dateFrom = when;
        if (dateTo === null || when > dateTo) dateTo = when;

        for (const row of chosen) {
            let personVotes = votesByPerson.get(row.personId);
            if (!personVotes) {
                personVotes = new Map();
                votesByPerson.set(row.personId, personVotes);
            }
            personVotes.set(subject.subjectId, row.voteType);
        }
    }

    const people: AgreementPerson[] = roster.map((member) => ({
        personId: member.personId,
        name: member.name,
        namedCount: votesByPerson.get(member.personId)?.size ?? 0,
    }));

    const pairPeople = people.filter((person) => person.namedCount > 0);
    const pairs: PairCell[] = [];
    for (let i = 0; i < pairPeople.length; i += 1) {
        const aVotes = votesByPerson.get(pairPeople[i].personId)!;
        for (let j = i + 1; j < pairPeople.length; j += 1) {
            const bVotes = votesByPerson.get(pairPeople[j].personId)!;
            let both = 0;
            let agreed = 0;
            for (const [subjectId, aType] of aVotes) {
                const bType = bVotes.get(subjectId);
                if (bType === undefined) continue;
                both += 1;
                if (aType === bType) agreed += 1;
            }
            pairs.push({
                aId: pairPeople[i].personId,
                bId: pairPeople[j].personId,
                agreed,
                both,
            });
        }
    }

    return {
        namedItems,
        unanimousCount,
        splitCount: splits.length,
        dateFrom,
        dateTo,
        people,
        pairs,
        splits,
    };
}
