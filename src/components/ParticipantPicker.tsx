import { useEffect, useState } from "react";
import { Participant } from "../dto/entities/Participant";
import { Schedule } from "../dto/entities/Schedule";
import { RestBuilder } from "../utils/RestBuilder";
import ParticipantGrid from "./ParticipantGrid";

type Props = {
    scheduleId: number;
    participants: Participant[];
    onSelect: (participant: Participant) => void;
};

export default function ParticipantPicker({ scheduleId, participants, onSelect }: Props) {
    const [scheduleName, setScheduleName] = useState('');
    const [nameError, setNameError] = useState(false);

    useEffect(() => {
        let active = true;
        setScheduleName('');
        setNameError(false);
        RestBuilder.setEndpoint('schedules/' + scheduleId + '/', 'GET').request()
            .then((schedule: Schedule) => { if (active) setScheduleName(schedule.name ?? ''); })
            .catch(() => { if (active) setNameError(true); });
        return () => { active = false; };
    }, [scheduleId]);

    const completedIds = new Set(participants
        .filter(participant => participant.id != null && participant.hasProposals === true)
        .map(participant => participant.id as number));

    return <>
        <div className="page-heading">
            <p className="eyebrow">Zaplanuj swoją służbę</p>
            <h1>Wybierz uczestnika</h1>
            {scheduleName && <h2 className="participant-schedule-name">{scheduleName}</h2>}
            <p>Wybierz uczestnika, aby wprowadzić dyspozycyjność.</p>
        </div>
        {nameError && <p role="status">Nie udało się pobrać nazwy grafiku.</p>}
        <p className="schedule-legend"><span className="status-dot" aria-hidden="true" /> Uczestnik z dodaną propozycją</p>
        <ParticipantGrid participants={participants} onSelect={onSelect} completedIds={completedIds} />
    </>;
}
