import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ScheduleDays from './ScheduleDays';
import { AuthService } from '../utils/AuthService';
import { RestBuilder } from '../utils/RestBuilder';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('loads participant flags in one request and groups and displays dates independently of names', async () => {
    vi.spyOn(AuthService, 'getParticipant').mockReturnValue({ id: 7, name: 'Anna' });
    const responses: Record<string, unknown> = {
        'schedules/42/': { id: 42, name: 'Grafik' },
        'schedules/42/days/?participantId=7': [
            { id: 1, name: 'Spotkanie A', date: '2026-11-02', hasProposals: true },
            { id: 2, name: 'Spotkanie B', date: '2026-11-04', hasProposals: false },
        ],
    };
    vi.spyOn(RestBuilder, 'setEndpoint').mockImplementation(endpoint => ({
        request: vi.fn().mockResolvedValue(responses[endpoint]),
    }) as unknown as RestBuilder);
    render(<MemoryRouter initialEntries={['/schedule/42']}>
        <Routes><Route path="/schedule/:scheduleId" element={<ScheduleDays />} /></Routes>
    </MemoryRouter>);
    const monday = await screen.findByRole('region', { name: 'Poniedziałek' });
    const mondayLink = within(monday).getByRole('link', { name: 'Spotkanie A' });
    expect(mondayLink).toHaveTextContent('02.11.2026');
    expect(mondayLink).toHaveClass('day-card--complete');
    expect(within(monday).getByRole('img', { name: 'Dodano propozycję' })).toBeInTheDocument();
    const wednesday = screen.getByRole('region', { name: 'Środa' });
    expect(within(wednesday).getByRole('link', { name: 'Spotkanie B' })).not.toHaveClass('day-card--complete');
    expect(within(wednesday).queryByRole('img')).not.toBeInTheDocument();
    expect(RestBuilder.setEndpoint).toHaveBeenCalledTimes(2);
    expect(RestBuilder.setEndpoint).toHaveBeenCalledWith('schedules/42/days/?participantId=7', 'GET');
});
