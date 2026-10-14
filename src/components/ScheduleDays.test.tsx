import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ScheduleDays from './ScheduleDays';
import { AuthService } from '../utils/AuthService';
import { RestBuilder } from '../utils/RestBuilder';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('marks only days with proposals for the selected participant', async () => {
    vi.spyOn(AuthService, 'getParticipant').mockReturnValue({ id: 7, name: 'Anna' });
    const responses: Record<string, unknown> = {
        'schedules/42/': { id: 42, name: 'Grafik' },
        'schedules/42/days/': [{ id: 1, name: 'Poniedziałek' }, { id: 2, name: 'Środa' }],
        'proposals/schedule-day/1/participant/7': [{ id: 100 }],
        'proposals/schedule-day/2/participant/7': [],
    };
    vi.spyOn(RestBuilder, 'setEndpoint').mockImplementation(endpoint => ({
        request: vi.fn().mockResolvedValue(responses[endpoint]),
    }) as unknown as RestBuilder);

    render(<MemoryRouter initialEntries={['/schedule/42']}>
        <Routes><Route path="/schedule/:scheduleId" element={<ScheduleDays />} /></Routes>
    </MemoryRouter>);

    await waitFor(() => expect(screen.getByRole('link', { name: 'Poniedziałek' }).parentElement)
        .toHaveTextContent('+ Poniedziałek'));
    expect(screen.getByRole('link', { name: 'Środa' }).parentElement).toHaveTextContent(/^Środa$/);
    expect(RestBuilder.setEndpoint).toHaveBeenCalledWith('proposals/schedule-day/2/participant/7', 'GET');
});
