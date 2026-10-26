import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import ParticipantPicker from './ParticipantPicker';
import { RestBuilder } from '../utils/RestBuilder';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const participants = [{ id: 1, name: 'Anna', hasProposals: true }, { id: 2, name: 'Jan', hasProposals: false }];

it('uses participant flags without fetching days or full proposals', async () => {
    vi.spyOn(RestBuilder, 'setEndpoint').mockReturnValue({
        request: vi.fn().mockResolvedValue({ name: 'Grafik Listopad 2026' }),
    } as unknown as RestBuilder);
    render(<ParticipantPicker scheduleId={42} participants={participants} onSelect={vi.fn()} />);
    expect(await screen.findByRole('heading', { name: 'Grafik Listopad 2026' })).toBeInTheDocument();
    const anna = screen.getByRole('button', { name: /Anna/ });
    expect(anna).toHaveClass('participant-card--complete');
    expect(within(anna).getByRole('img', { name: 'Dodano propozycję' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Jan' })).not.toHaveClass('participant-card--complete');
    expect(RestBuilder.setEndpoint).toHaveBeenCalledTimes(1);
    expect(RestBuilder.setEndpoint).toHaveBeenCalledWith('schedules/42/', 'GET');
});

it('keeps participant flags and selection available when the schedule name fails to load', async () => {
    vi.spyOn(RestBuilder, 'setEndpoint').mockReturnValue({
        request: vi.fn().mockRejectedValue(new Error('Unavailable')),
    } as unknown as RestBuilder);
    render(<ParticipantPicker scheduleId={42} participants={participants} onSelect={vi.fn()} />);
    expect(await screen.findByText('Nie udało się pobrać nazwy grafiku.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Anna/ })).toHaveClass('participant-card--complete');
    expect(screen.getByRole('button', { name: 'Jan' })).toBeEnabled();
});
