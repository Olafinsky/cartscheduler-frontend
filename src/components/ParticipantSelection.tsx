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

        RestBuilder.setEndpoint('participants/', 'GET').request()
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
        <h1>Wybierz uczestnika</h1>
        {loading && <p role="status">Ładowanie uczestników…</p>}
        {error && <p role="alert">Nie udało się pobrać uczestników. Odśwież stronę lub otwórz ponownie link zaproszenia.</p>}
        {!loading && !error && participants.length === 0 && <p>Brak uczestników do wyboru.</p>}
        {participants.map(participant => <div key={participant.id}>
            <button type="button" className="btn btn-link p-0" onClick={() => selectParticipant(participant)}>
                {participant.name}
            </button>
        </div>)}
    </>;
}

export default ParticipantSelection;
