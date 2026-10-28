import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../utils/AuthService';
import { ProposalService } from '../utils/ProposalService';
import { RestBuilder } from '../utils/RestBuilder';
import ProposalComponent from './ProposalComponent';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const setup = (permission: boolean | 0 | 1, allowAlternativeGroupSelection = false) => {
    vi.spyOn(AuthService, 'getAuthentication').mockReturnValue({allowPairSelection: permission, allowAlternativeGroupSelection});
    vi.spyOn(AuthService, 'getParticipant').mockReturnValue({id: 42});
    vi.spyOn(ProposalService, 'find').mockResolvedValue([{id: 1, alternativeGroup: "A", breakMode: 2, breakLengthStart: 1, breakLengthEnd: 2, pairParticipantId: 43}]);
    vi.spyOn(ProposalService, 'create').mockResolvedValue({id: 2});
    vi.spyOn(ProposalService, 'prefill').mockResolvedValue({available: false, source: null, values: null});
    vi.spyOn(RestBuilder, 'setEndpoint').mockImplementation((endpoint) => ({request: vi.fn().mockResolvedValue(endpoint === 'schedules/1/days/' ? [{id: 8, name: 'Monday'}, {id: 9, name: 'Wednesday'}] : endpoint === 'participants/' ? [{id: 42, name: 'Anna'}, {id: 43, name: 'Jan'}] : {id: 8, name: 'Dzien', firstHour: 7, lastHour: 17})}) as unknown as RestBuilder);
    render(<MemoryRouter initialEntries={['/schedule/1/day/8']}><Routes><Route path="/schedule/:scheduleId/day/:dayId" element={<ProposalComponent />} /></Routes></MemoryRouter>);
};
describe('ProposalComponent', () => {
    it('uses permission and assigned participants and sends the chosen pair', async () => {
        setup(1);
        await userEvent.click(await screen.findByRole('button', {name: 'Dodaj propozycję'}));
        await userEvent.selectOptions(screen.getByLabelText('Uczestnik do pary'), '43');
        await userEvent.click(screen.getByRole('button', {name: 'Dodaj'}));
        expect(ProposalService.create).toHaveBeenCalledWith(expect.objectContaining({pairParticipantId: 43, breakMode: 0}));
        await waitFor(() => expect(screen.queryByRole('form')).not.toBeInTheDocument());
        expect(ProposalService.find).toHaveBeenCalledTimes(2);
        expect(screen.getByRole('columnheader', {name: 'Uczestnik do pary'})).toBeInTheDocument();
        expect(screen.getByRole('cell', {name: 'Jan'})).toBeInTheDocument();
        expect(screen.getByRole('cell', {name: 'Obojętnie (1-2)'})).toBeInTheDocument();
    });
    it('hides the dropdown when API permission is false', async () => {
        setup(false);
        await userEvent.click(await screen.findByRole('button', {name: 'Dodaj propozycję'}));
        expect(screen.queryByLabelText('Uczestnik do pary')).not.toBeInTheDocument();
        expect(screen.queryByRole('columnheader', {name: 'Uczestnik do pary'})).not.toBeInTheDocument();
        expect(screen.getAllByRole('cell')).toHaveLength(4);
        expect(RestBuilder.setEndpoint).not.toHaveBeenCalledWith('participants/', 'GET');
    });
});

it('loads group usage across days, displays the group and submits it', async () => {
    setup(false, true);
    expect(await screen.findByRole('cell', {name: 'A'})).toBeInTheDocument();
    await userEvent.click(await screen.findByRole('button', {name: 'Dodaj propozycję'}));
    await userEvent.type(screen.getByLabelText('Grupa propozycji'), 'A');
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Monday, Wednesday'));
    expect(ProposalService.find).toHaveBeenCalledWith(9);
    await userEvent.click(screen.getByRole('button', {name: 'Dodaj'}));
    expect(ProposalService.create).toHaveBeenCalledWith(expect.objectContaining({alternativeGroup: 'A'}));
});

it('refreshes prefill after deleting and saving, without automatically replacing form values', async () => {
    setup(false);
    const source = {scheduleId: 1, scheduleDayId: 2, date: '2026-10-26', dayOfWeek: 'MONDAY' as const, proposalId: 3, proposalIndex: 0, proposalCount: 2};
    vi.mocked(ProposalService.prefill).mockResolvedValue({available: true, source,
        values: {hourStart: 11, hourEnd: 11, serviceLengthStart: 1, serviceLengthEnd: 1,
            breakMode: 0, breakLengthStart: null, breakLengthEnd: null, alternativeGroup: null, pairParticipantId: null}});
    vi.spyOn(ProposalService, 'delete').mockResolvedValue(undefined);
    await userEvent.click(await screen.findByRole('button', {name: 'Dodaj propozycję'}));
    await userEvent.click(await screen.findByRole('button', {name: 'Załaduj z ostatniego poniedziałku'}));
    expect(ProposalService.prefill).toHaveBeenCalledWith('8', 42);
    expect(screen.getByLabelText('Służba od')).toHaveValue('11');
    const beforeDelete = vi.mocked(ProposalService.prefill).mock.calls.length;
    vi.mocked(ProposalService.find).mockResolvedValueOnce([]);
    await userEvent.click(screen.getByRole('button', {name: 'Usuń propozycję'}));
    await waitFor(() => expect(vi.mocked(ProposalService.prefill).mock.calls.length).toBeGreaterThan(beforeDelete));
    expect(screen.getByLabelText('Służba od')).toHaveValue('11');
    const beforeSave = vi.mocked(ProposalService.prefill).mock.calls.length;
    await userEvent.click(screen.getByRole('button', {name: 'Dodaj'}));
    await waitFor(() => expect(vi.mocked(ProposalService.prefill).mock.calls.length).toBeGreaterThan(beforeSave));
    expect(ProposalService.create).toHaveBeenCalledWith(expect.objectContaining({hourStart: 11, hourEnd: 11, participantId: 42, scheduleDayId: 8}));
});

it('keeps manual entry available when prefill fails', async () => {
    setup(false);
    vi.mocked(ProposalService.prefill).mockRejectedValue(new Error('Network error'));
    await userEvent.click(await screen.findByRole('button', {name: 'Dodaj propozycję'}));
    expect(await screen.findByRole('alert')).toHaveTextContent('Nie udało się pobrać poprzedniej propozycji');
    expect(screen.queryByRole('button', {name: /Załaduj/})).not.toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Dodaj'})).toBeEnabled();
});
