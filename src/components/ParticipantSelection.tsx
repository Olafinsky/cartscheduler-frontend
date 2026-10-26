import ParticipantPicker from "./ParticipantPicker";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Participant } from "../dto/entities/Participant";
import { AuthService } from "../utils/AuthService";
import { RestBuilder } from "../utils/RestBuilder";

function ParticipantSelection() {
    const navigate = useNavigate();
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const scheduleId = AuthService.getAuthentication()?.scheduleId;

    useEffect(() => {
        let active = true;
        if (!AuthService.isAuthenticated() || scheduleId == null) {
            setError(true);
            setLoading(false);
            return;
        }

        RestBuilder.setEndpoint(`schedules/${scheduleId}/participants/`, 'GET').request()
            .then(result => { if (active) setParticipants(result as Participant[]); })
            .catch(() => { if (active) setError(true); })
            .finally(() => { if (active) setLoading(false); });

        return () => { active = false; };
    }, [scheduleId]);

    const selectParticipant = (participant: Participant) => {
        AuthService.setParticipant(participant);
        navigate(`/schedule/${scheduleId}`);
    };

    return <>
        {loading && <p role="status">Ładowanie uczestników…</p>}
        {error && <p role="alert">Nie udało się pobrać uczestników. Odśwież stronę lub otwórz ponownie link zaproszenia.</p>}
        {!loading && !error && participants.length === 0 && <p>Brak uczestników do wyboru.</p>}
        {!loading && !error && scheduleId != null && <ParticipantPicker scheduleId={scheduleId} participants={participants} onSelect={selectParticipant} />}
    </>;
}

export default ParticipantSelection;
