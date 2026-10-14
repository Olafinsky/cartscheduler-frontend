import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import Home from './Home';
import { Participant } from '../dto/entities/Participant';
import { RestAuthResponse } from '../dto/response/RestAuthResponse';
import { AuthService } from '../utils/AuthService';
import { RestBuilder } from '../utils/RestBuilder';

const authentication = (scheduleId?: number): RestAuthResponse => ({
  jwtToken: 'jwt-token',
  expiresAt: Date.now() + 60_000,
  scheduleId,
});

const participant = (id: number, name: string): Participant => ({ id, name });

function CurrentLocation() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderHome(path = '/login/invitation-token') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login/:token" element={<Home />} />
        <Route path="/schedule/:scheduleId" element={<CurrentLocation />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Home', () => {
  let requestMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    requestMock = vi.fn();

    vi.spyOn(AuthService, 'isAuthenticated').mockReturnValue(false);
    vi.spyOn(AuthService, 'getParticipant').mockReturnValue(null);
    vi.spyOn(AuthService, 'getAuthentication').mockReturnValue(null);
    vi.spyOn(AuthService, 'storeInvitationToken').mockImplementation(() => undefined);
    vi.spyOn(AuthService, 'setParticipant').mockImplementation(() => undefined);
    vi.spyOn(AuthService, 'login').mockResolvedValue(authentication(42));

    vi.spyOn(RestBuilder, 'setEndpoint').mockImplementation(() => ({
      request: requestMock,
    }) as unknown as RestBuilder);

    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('pokazuje błąd, gdy w adresie nie ma tokenu zaproszenia', async () => {
    renderHome('/');

    expect(await screen.findByText('Błąd logowania. Nieaktualny link')).toBeInTheDocument();
    expect(AuthService.login).not.toHaveBeenCalled();
  });

  it('zapisuje token i pobiera uczestników po poprawnym logowaniu', async () => {
    requestMock.mockResolvedValue([
      participant(1, 'Anna'),
      participant(2, 'Jan'),
    ]);

    renderHome();

    expect(await screen.findByText('Anna')).toBeInTheDocument();
    expect(screen.getByText('Jan')).toBeInTheDocument();
    expect(AuthService.storeInvitationToken).toHaveBeenCalledWith('invitation-token');
    expect(AuthService.login).toHaveBeenCalledOnce();
    expect(RestBuilder.setEndpoint).toHaveBeenCalledWith('participants/', 'GET');
  });

  it('zapisuje wybranego uczestnika i przechodzi do harmonogramu', async () => {
    const user = userEvent.setup();
    const anna = participant(1, 'Anna');
    requestMock.mockResolvedValue([anna, participant(2, 'Jan')]);

    renderHome();
    await user.click(await screen.findByText('Anna'));

    expect(AuthService.setParticipant).toHaveBeenCalledWith(anna);
    expect(screen.getByTestId('location')).toHaveTextContent('/schedule/42');
  });

  it('automatycznie wybiera jedynego uczestnika i przechodzi do harmonogramu', async () => {
    const anna = participant(1, 'Anna');
    requestMock.mockResolvedValue([anna]);

    renderHome();

    expect(await screen.findByTestId('location')).toHaveTextContent('/schedule/42');
    expect(AuthService.setParticipant).toHaveBeenCalledWith(anna);
  });

  it('pokazuje błąd, gdy logowanie zostanie odrzucone', async () => {
    vi.mocked(AuthService.login).mockRejectedValue(new Error('Unauthorized'));

    renderHome();

    expect(await screen.findByText('Błąd logowania. Nieaktualny link')).toBeInTheDocument();
    expect(requestMock).not.toHaveBeenCalled();
  });

  it('pokazuje błąd, gdy odpowiedź logowania nie zawiera identyfikatora harmonogramu', async () => {
    vi.mocked(AuthService.login).mockResolvedValue(authentication());

    renderHome();

    expect(await screen.findByText('Błąd logowania. Nieaktualny link')).toBeInTheDocument();
    expect(requestMock).not.toHaveBeenCalled();
  });

  it('informuje o braku kandydatów, gdy API zwraca pustą listę', async () => {
    requestMock.mockResolvedValue([]);

    renderHome();

    expect(await screen.findByText('Brak kandydatów do wyboru.')).toBeInTheDocument();
    expect(screen.queryByText('Błąd logowania. Nieaktualny link')).not.toBeInTheDocument();
  });

  it('pokazuje błąd, gdy nie uda się pobrać uczestników', async () => {
    requestMock.mockRejectedValue(new Error('Network error'));

    renderHome();

    expect(await screen.findByText('Błąd logowania. Nieaktualny link')).toBeInTheDocument();
  });

  it('przekierowuje użytkownika z aktywną sesją do jego harmonogramu', async () => {
    vi.mocked(AuthService.isAuthenticated).mockReturnValue(true);
    vi.mocked(AuthService.getParticipant).mockReturnValue(participant(1, 'Anna'));
    vi.mocked(AuthService.getAuthentication).mockReturnValue(authentication(7));

    renderHome('/');

    expect(await screen.findByTestId('location')).toHaveTextContent('/schedule/7');
    expect(AuthService.login).not.toHaveBeenCalled();
  });
});
