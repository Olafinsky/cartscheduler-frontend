import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { AuthService } from '../utils/AuthService';
import { RestBuilder } from '../utils/RestBuilder';

beforeEach(() => {
    AuthService.clearSession();
    vi.spyOn(RestBuilder, 'setEndpoint').mockImplementation(endpoint => ({request: vi.fn().mockResolvedValue(endpoint === 'schedules/1/' ? {id: 1, name: 'Grafik'} : [])}) as unknown as RestBuilder);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); AuthService.clearSession(); });

const open = (path: string) => {
    window.history.replaceState({}, '', path);
    render(<App />);
};
const authenticate = (expiresAt = Date.now() + 60_000) => AuthService.setAuthentication({jwtToken: 'jwt', expiresAt, scheduleId: 1});
const expectBlocked = () => {
    expect(screen.getByRole('alert')).toHaveTextContent('Błąd logowania. Nieaktualny link');
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
};

describe('schedule access', () => {
    it.each(['/schedule', '/schedule/1', '/schedule/1/day/1', '/schedule/unknown/path'])('blocks %s without login and does not fetch data', path => {
        AuthService.setParticipant({id: 7, name: 'Anna'});
        open(path);
        expectBlocked();
        expect(RestBuilder.setEndpoint).not.toHaveBeenCalled();
    });
    it.each(['/schedule/1', '/schedule/1/day/1'])('blocks %s without a selected participant', path => {
        authenticate();
        open(path);
        expectBlocked();
        expect(RestBuilder.setEndpoint).not.toHaveBeenCalled();
    });
    it('blocks expired sessions and participants without an ID', () => {
        authenticate(Date.now() - 1);
        AuthService.setParticipant({id: 7, name: 'Anna'});
        open('/schedule/1/day/1');
        expectBlocked();
        expect(RestBuilder.setEndpoint).not.toHaveBeenCalled();
        act(() => { authenticate(); AuthService.setParticipant({name: 'Anna'}); });
        expectBlocked();
        expect(RestBuilder.setEndpoint).not.toHaveBeenCalled();
    });
    it('shows data with a valid session and hides it immediately after clearing the session', async () => {
        authenticate();
        AuthService.setParticipant({id: 7, name: 'Anna'});
        open('/schedule/1');
        expect(await screen.findByRole('heading', {name: 'Grafik'})).toBeInTheDocument();
        expect(screen.getByText('Anna')).toBeInTheDocument();
        act(() => AuthService.clearSession());
        expectBlocked();
        expect(screen.queryByText('Anna')).not.toBeInTheDocument();
    });
    it('hides an open schedule when the session expires', async () => {
        vi.useFakeTimers();
        authenticate(Date.now() + 2000);
        AuthService.setParticipant({id: 7, name: 'Anna'});
        await act(async () => { open('/schedule/1'); });
        expect(screen.getByRole('heading', {name: 'Grafik'})).toBeInTheDocument();
        act(() => { vi.advanceTimersByTime(1000); });
        expectBlocked();
    });
});
