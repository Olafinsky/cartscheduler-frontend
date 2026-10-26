import ParticipantPicker from "./ParticipantPicker";
import { useEffect, useState } from "react";
import { RestBuilder } from "../utils/RestBuilder";
import { useNavigate, useParams } from "react-router-dom";
import { AuthService } from "../utils/AuthService";
import { Participant } from "../dto/entities/Participant";


function Home() {

    const { token } = useParams();
    const navigate = useNavigate();

    const [loginError, setLoginError] = useState<boolean>(false);
    const [noCandidates, setNoCandidates] = useState(false);
    const [scheduleId, setScheduleId] = useState<number|null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);

    const selectParticipant = (participant: Participant) => {
        AuthService.setParticipant(participant);
        navigate(`/schedule/${scheduleId}`);
    }

    useEffect(() => {
        let active = true;
        setLoginError(false);
        setNoCandidates(false);
        setScheduleId(null);
        setParticipants([]);

        if (token == null) {
            if (AuthService.isAuthenticated() && AuthService.getParticipant() != null) {
                navigate(`/schedule/${AuthService.getAuthentication()?.scheduleId}`);
            } else {
                setLoginError(true);
            }
            return;
        }

        AuthService.clearSession();
        AuthService.storeInvitationToken(token);
        const login = async () => {
            try {
                const authentication = await AuthService.login();
                if (!active) return;
                if (authentication?.scheduleId == null) {
                    setLoginError(true);
                    return;
                }
                setScheduleId(authentication.scheduleId);
                const participants = await RestBuilder.setEndpoint(`schedules/${authentication.scheduleId}/participants/`, 'GET').request() as Participant[];
                if (!active) return;
                if (participants.length === 1) {
                    AuthService.setParticipant(participants[0]);
                    navigate(`/schedule/${authentication.scheduleId}`);
                } else if (participants.length > 1) {
                    setParticipants(participants);
                } else {
                    setNoCandidates(true);
                }
            } catch (error) {
                if (active) {
                    console.error(error);
                    setLoginError(true);
                }
            }
        };
        void login();
        return () => { active = false; };
    }, [token, navigate]);

    return <>
        {loginError ? 'Błąd logowania. Nieaktualny link' : ''}
        {noCandidates && !loginError && <p>Brak kandydatów do wyboru.</p>}
        {participants.length > 0 && scheduleId != null && <ParticipantPicker scheduleId={scheduleId} participants={participants} onSelect={selectParticipant} />}
    </>;
}

export default Home;
