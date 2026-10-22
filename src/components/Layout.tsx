import { useEffect, useReducer } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { AuthService } from "../utils/AuthService";

function Layout() {
    const [, refreshSession] = useReducer(value => value + 1, 0);
    const participant = AuthService.getParticipant();
    const authentication = AuthService.getAuthentication();
    const scheduleId = authentication?.scheduleId;
    const expiresAt = authentication?.expiresAt;
    const { pathname } = useLocation();
    const isParticipantSelection = pathname.replace(/\/+$/, '') === '/participants';
    const isSchedule = /^\/schedule(?:\/|$)/.test(pathname);

    useEffect(() => AuthService.subscribeSession(refreshSession), []);

    useEffect(() => {
        if (expiresAt == null) return;
        const remaining = expiresAt - AuthService.tokenValidityLeeway - Date.now();
        if (remaining <= 0) return;
        const timer = window.setTimeout(refreshSession, remaining);
        return () => window.clearTimeout(timer);
    }, [expiresAt]);

    if (isSchedule && (!AuthService.isAuthenticated() || participant?.id == null)) {
        return <p role="alert">Błąd logowania. Nieaktualny link</p>;
    }

    return <>
        {participant && <div><Link to="/participants">Zmień uczestnika</Link></div>}
        <div>{participant ? participant.name : '???'}</div>
        {participant && scheduleId != null && !isParticipantSelection && <div><Link to={`/schedule/${scheduleId}`}>Wybierz dzień</Link></div>}
        <Outlet />
    </>;
}

export default Layout;
