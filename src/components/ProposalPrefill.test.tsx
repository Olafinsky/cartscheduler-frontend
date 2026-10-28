import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { ProposalPrefill, prefillDayLabels } from '../dto/entities/ProposalPrefill';
import CreateProposalForm from './CreateProposalForm';

afterEach(cleanup);
const prefill: Extract<ProposalPrefill, {available: true}> = {
    available: true,
    source: {scheduleId: 1, scheduleDayId: 2, date: '2026-10-26', dayOfWeek: 'MONDAY', proposalId: 3, proposalIndex: 0, proposalCount: 2},
    values: {hourStart: 11, hourEnd: 15, serviceLengthStart: 2, serviceLengthEnd: 3, breakMode: 2,
        breakLengthStart: 1, breakLengthEnd: 2, alternativeGroup: 'A', pairParticipantId: 43},
};
const setup = (data: ProposalPrefill = prefill, permissions = true) => {
    const submit = vi.fn().mockResolvedValue(undefined);
    render(<CreateProposalForm firstHour={7} lastHour={17} participantId={42} scheduleDayId={8}
        prefill={data} allowPairSelection={permissions} allowAlternativeGroupSelection={permissions}
        participants={[{id: 43, name: 'Jan'}]} onSubmit={submit} onCancel={vi.fn()} />);
    return submit;
};

it('loads all fields only on click and preserves target IDs and API end hour', async () => {
    const submit = setup();
    expect(screen.getByLabelText('Służba od')).toHaveValue('7');
    await userEvent.click(screen.getByRole('button', {name: 'Załaduj z ostatniego poniedziałku'}));
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Służba do')).toHaveValue('16');
    expect(screen.getByLabelText('Grupa propozycji')).toHaveValue('A');
    expect(screen.getByLabelText('Uczestnik do pary')).toHaveValue('43');
    await userEvent.click(screen.getByRole('button', {name: 'Dodaj'}));
    expect(submit).toHaveBeenCalledWith({...prefill.values, participantId: 42, scheduleDayId: 8});
});

it('does not copy fields unavailable to the current participant', async () => {
    const submit = setup(prefill, false);
    await userEvent.click(screen.getByRole('button', {name: /Załaduj/}));
    await userEvent.click(screen.getByRole('button', {name: 'Dodaj'}));
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({alternativeGroup: null, pairParticipantId: null}));
});

it('hides the button when no source exists', () => {
    setup({available: false, source: null, values: null});
    expect(screen.queryByRole('button', {name: /Załaduj/})).not.toBeInTheDocument();
});

it('preserves a 2–8 break for 9–18 availability and 1–2 service length', async () => {
    const values = {...prefill.values, hourStart: 9, hourEnd: 17, serviceLengthStart: 1, serviceLengthEnd: 2,
        breakMode: 1, breakLengthStart: 2, breakLengthEnd: 8};
    const submit = setup({...prefill, values});
    await userEvent.click(screen.getByRole('button', {name: /Załaduj/}));
    expect(screen.getByLabelText('Długość przerwy od')).toHaveValue('2');
    expect(screen.getByLabelText('Długość przerwy do')).toHaveValue('8');
    await userEvent.click(screen.getByRole('button', {name: 'Dodaj'}));
    expect(submit).toHaveBeenCalledWith({...values, participantId: 42, scheduleDayId: 8});
});

it.each(Object.entries(prefillDayLabels))('uses the Polish label for %s', (day, label) => {
    setup({...prefill, source: {...prefill.source, dayOfWeek: day as keyof typeof prefillDayLabels}});
    expect(screen.getByRole('button', {name: `Załaduj z ${label}`})).toBeInTheDocument();
});
