import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ScheduleDay } from "../dto/entities/ScheduleDay";
import { Proposal } from "../dto/entities/Proposal";
import { AuthService } from "../utils/AuthService";
import { ProposalService } from "../utils/ProposalService";
import { RestBuilder } from "../utils/RestBuilder";
import CreateProposalForm from "./CreateProposalForm";

function ProposalComponent() {
    const [scheduleDay, setScheduleDay] = useState<ScheduleDay>(new ScheduleDay());
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [showForm, setShowForm] = useState(false);
    const { dayId, scheduleId } = useParams();
    const refreshProposals = useCallback(
        () => ProposalService.find(dayId as string).then(setProposals),
        [dayId],
    );

    useEffect(() => {
        RestBuilder.setEndpoint(`schedules/${scheduleId}/days/${dayId}/`, 'GET').request()
            .then(result => setScheduleDay(result as ScheduleDay));
        refreshProposals();
    }, [dayId, scheduleId, refreshProposals]);

    const participantId = AuthService.getParticipant()?.id;
    const canCreate = scheduleDay.id != null && scheduleDay.firstHour != null && scheduleDay.lastHour != null && participantId != null;

    return <>
        <h1>{scheduleDay.name}</h1>
        {!showForm && canCreate && <button className="btn btn-primary proposal-add-button" type="button" onClick={() => setShowForm(true)}>Dodaj propozycję</button>}
        {showForm && canCreate && <CreateProposalForm
            firstHour={scheduleDay.firstHour as number} lastHour={scheduleDay.lastHour as number}
            participantId={participantId as number} scheduleDayId={scheduleDay.id as number}
            onCancel={() => setShowForm(false)}
            onSubmit={async request => { await ProposalService.create(request); await refreshProposals(); setShowForm(false); }} />}
        <table>
            <thead><tr><th>Czas</th><th>Długość służby</th><th>Przerwa</th><th /></tr></thead>
            <tbody>{proposals.map(item => <tr key={item.id}>
                <td>{item.hourStart == null || item.hourEnd == null ? '-' : `${item.hourStart}:00 - ${item.hourEnd + 1}:00`}</td><td>{item.serviceLengthStart}-{item.serviceLengthEnd}</td>
                <td>{item.breakLengthStart == null ? '-' : `${item.breakLengthStart}-${item.breakLengthEnd}`}</td>
                <td><button className="btn btn-link p-0" type="button" onClick={() => ProposalService.delete(item.id as number).then(refreshProposals)}>Usuń</button></td>
            </tr>)}</tbody>
        </table>
    </>;
}

export default ProposalComponent;
