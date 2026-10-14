import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Layout from './Layout';
import ParticipantSelection from './ParticipantSelection';
import { AuthService } from '../utils/AuthService';
import { RestBuilder } from '../utils/RestBuilder';

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    sessionStorage.clear();
});

it('changes the participant through the header link and returns to the schedule', async () => {
    const user = userEvent.setup();
    const anna = { id: 1, name: 'Anna' };
    const jan = { id: 2, name: 'Jan' };
    sessionStorage.setItem('participant', JSON.stringify(anna));
    vi.spyOn(AuthService, 'isAuthenticated').mockReturnValue(true);
    vi.spyOn(AuthService, 'getAuthentication').mockReturnValue({
        jwtToken: 'token', expiresAt: Date.now() + 60_000, scheduleId: 42,
    });
    // Keep the real subscription so the header must react to the selection.
    vi.spyOn(AuthService, 'getParticipant').mockImplementation(() =>
        JSON.parse(sessionStorage.getItem('participant') as string));
    vi.spyOn(AuthService, 'setParticipant');
    vi.spyOn(RestBuilder, 'setEndpoint').mockReturnValue({
        request: vi.fn().mockResolvedValue([anna, jan]),
    } as unknown as RestBuilder);

    render(<MemoryRouter initialEntries={['/schedule/42']}>
        <Routes>
            <Route element={<Layout />}>
                <Route path="/schedule/42" element={<h1>Grafik</h1>} />
                <Route path="/participants" element={<ParticipantSelection />} />
            </Route>
        </Routes>
    </MemoryRouter>);

    await user.click(screen.getByRole('link', { name: 'Zmień uczestnika' }));
    await user.click(await screen.findByRole('button', { name: 'Jan' }));

    expect(AuthService.setParticipant).toHaveBeenCalledWith(jan);
    expect(screen.getByRole('heading', { name: 'Grafik' })).toBeInTheDocument();
    expect(screen.getByText('Jan')).toBeInTheDocument();
    expect(screen.queryByText('Anna')).not.toBeInTheDocument();
});
