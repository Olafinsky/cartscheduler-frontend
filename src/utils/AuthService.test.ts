import { afterEach, expect, it, vi } from 'vitest';
import { AuthService } from './AuthService';
import { RestBuilder } from './RestBuilder';
import { RestAuthResponse } from '../dto/response/RestAuthResponse';

afterEach(() => { vi.restoreAllMocks(); AuthService.clearSession(); });

it('clears cached session data, storage and notifies participant listeners', () => {
    AuthService.setAuthentication({jwtToken: 'old', allowPairSelection: true});
    AuthService.setParticipant({id: 99});
    AuthService.storeInvitationToken('old-invitation');
    const listener = vi.fn();
    const unsubscribe = AuthService.subscribeParticipant(listener);
    AuthService.clearSession();
    expect(AuthService.getAuthentication()).toBeNull();
    expect(AuthService.getParticipant()).toBeNull();
    expect(AuthService.getInvitationToken()).toBeNull();
    for (const key of ['authentication', 'participant', 'invitation_token']) expect(sessionStorage.getItem(key)).toBeNull();
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
});

it('stores new permissions and prevents an older login from overwriting them', async () => {
    let resolveOld!: (value: RestAuthResponse) => void;
    const request = vi.fn().mockImplementationOnce(() => new Promise(resolve => {resolveOld = resolve;}))
        .mockResolvedValueOnce({jwtToken: 'new', scheduleId: 42, allowPairSelection: false});
    const builder = {nonAuthenticated: () => builder, request};
    vi.spyOn(RestBuilder, 'setEndpoint').mockReturnValue(builder as unknown as RestBuilder);
    AuthService.clearSession();
    AuthService.storeInvitationToken('old');
    const oldLogin = AuthService.login();
    const oldFailure = expect(oldLogin).rejects.toThrow('Login superseded');
    AuthService.clearSession();
    AuthService.storeInvitationToken('new');
    await AuthService.login();
    resolveOld({jwtToken: 'old', allowPairSelection: true});
    await oldFailure;
    expect(AuthService.getAuthentication()).toEqual({jwtToken: 'new', scheduleId: 42, allowPairSelection: false});
    expect(JSON.parse(sessionStorage.getItem('authentication')!)).toEqual(AuthService.getAuthentication());
    expect(request).toHaveBeenNthCalledWith(2, {invitationToken: 'new'});
});
