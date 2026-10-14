import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Participant } from "../dto/entities/Participant";
import { AuthService } from "../utils/AuthService";

function Layout() {

    const [participant, setParticipant] = useState<Participant|null>(null);
    const scheduleId = AuthService.getAuthentication()?.scheduleId;
    const { pathname } = useLocation();
    const isParticipantSelection = pathname.replace(/\/+$/, '') === '/participants';

    useEffect(() => {
		setParticipant(AuthService.getParticipant());
		 const unsubscribe = AuthService.subscribeParticipant(() => {
			setParticipant(AuthService.getParticipant());
		});
		return unsubscribe;
    }, []);

    return (
        <>
			{participant && <div><Link to="/participants">Zmień uczestnika</Link></div>}
			<div>
				{participant ? participant.name : '???'}
			</div>
			{participant && scheduleId != null && !isParticipantSelection && <div><Link to={`/schedule/${scheduleId}`}>Wybierz dzień</Link></div>}

			<Outlet />
        </>
    )
}

export default Layout
