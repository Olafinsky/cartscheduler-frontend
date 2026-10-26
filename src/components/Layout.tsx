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

    const isDayView = /^\/schedule\/[^/]+\/day\/[^/]+\/?$/.test(pathname);
    return <div className="app-shell">
        <header className="app-header">
            <div className="app-brand"><span className="app-brand__mark" aria-hidden="true">▦</span><span>Plan służby</span></div>
            {participant?.name && <div className="session-panel"><div className="session-participant"><span className="eyebrow">Wybrany uczestnik</span><strong>{participant.name}</strong></div><nav aria-label="Nawigacja uczestnika"><Link className="nav-button" to="/participants">Zmień uczestnika</Link>{scheduleId != null && !isParticipantSelection && isDayView && <Link className="nav-button" to={`/schedule/${scheduleId}`}>Wybierz dzień</Link>}</nav></div>}
        </header>
        <main className="app-content"><Outlet /></main>
    </div>;
}
export default Layout;
