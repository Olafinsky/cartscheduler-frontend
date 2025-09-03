import { useEffect, useState } from "react";
import { RestBuilder } from "../utils/RestBuilder";
import { useNavigate, useParams } from "react-router-dom";
import { AuthService } from "../utils/AuthService";
import { Participant } from "../dto/entities/Participant";


function ParticipantList({participants, selectParticipant}: {participants: Participant[], selectParticipant: (participant: Participant) => void}) {
    return participants.map((item) => (
        <span key={item.id}><a onClick={() => selectParticipant(item)}>{item.name}</a><br /></span>
    ))
}

function Home() {

    let { token } = useParams();
    let navigate = useNavigate();

    const [loginError, setLoginError] = useState<boolean>(false);
    const [scheduleId, setScheduleId] = useState<number|null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);

    let selectParticipant = (participant: Participant) => {
        AuthService.setParticipant(participant);
        navigate(`/schedule/${scheduleId}`);
    }

    useEffect(() => {
        if (AuthService.isAuthenticated() && AuthService.getParticipant() != null) {
            navigate(`/schedule/${AuthService.getAuthentication()?.scheduleId}`);
        }

        if (token != null) {
            AuthService.storeInvitationToken(token);
            AuthService.login()
                .then(
                    loginRespone => {
                        if (loginRespone?.scheduleId == null) {
                            setLoginError(true);
                            return;
                        }
                        setScheduleId(loginRespone.scheduleId);
                        RestBuilder.setEndpoint('participants/', 'GET')
                            .request()
                            .then(
                                (participantsResponse) => {
                                    let participants = participantsResponse as Participant[];
                                    if (participants.length == 1) {
                                        AuthService.setParticipant(participants[0]);
                                        navigate(`/schedule/${scheduleId}`);
                                    }
                                    else if (participants.length > 1) {
                                        setParticipants(participants);
                                    }
                                    else {
                                        setLoginError(true);
                                    }
                                },
                                error => {
                                    console.error(error);
                                    setLoginError(true);
                                }
                            )
                        
                    },
                    error => {
                        console.error(error);
                        setLoginError(true);
                    }
                );
        }
        else {
            setLoginError(true)
        }
    }, []);
    

    return <>
        {loginError ? 'Błąd logowania. Nieaktualny link' : ''}
        <ParticipantList participants={participants} selectParticipant={selectParticipant} />
    </>
}

export default Home