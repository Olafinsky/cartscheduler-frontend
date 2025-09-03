import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Participant } from "../dto/entities/Participant";
import { AuthService } from "../utils/AuthService";

function Layout() {

    const [participant, setParticipant] = useState<Participant|null>(null);

    useEffect(() => {
		setParticipant(AuthService.getParticipant());
		 const unsubscribe = AuthService.subscribeParticipant(() => {
			setParticipant(AuthService.getParticipant());
		});
		return unsubscribe;
    }, []);

    return (
        <>
			<div>
				{participant ? participant.name : '???'}
			</div>

			<Outlet />
        </>
    )
}

export default Layout