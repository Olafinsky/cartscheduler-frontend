import { BreakMode } from './BreakMode';

export const prefillDayLabels = {
    MONDAY: 'ostatniego poniedziałku',
    TUESDAY: 'ostatniego wtorku',
    WEDNESDAY: 'ostatniej środy',
    THURSDAY: 'ostatniego czwartku',
    FRIDAY: 'ostatniego piątku',
    SATURDAY: 'ostatniej soboty',
    SUNDAY: 'ostatniej niedzieli',
};

export type ProposalPrefill = { available: false; source: null; values: null } | {
    available: true;
    source: {
        scheduleId: number;
        scheduleDayId: number;
        date: string;
        dayOfWeek: keyof typeof prefillDayLabels;
        proposalId: number;
        proposalIndex: number;
        proposalCount: number;
    };
    values: {
        hourStart: number;
        hourEnd: number;
        serviceLengthStart: number;
        serviceLengthEnd: number;
        breakMode: BreakMode;
        breakLengthStart: number | null;
        breakLengthEnd: number | null;
        alternativeGroup: string | null;
        pairParticipantId: number | null;
    };
};
