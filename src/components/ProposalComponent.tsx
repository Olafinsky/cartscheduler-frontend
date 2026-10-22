import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ScheduleDay } from "../dto/entities/ScheduleDay";
import { Proposal } from "../dto/entities/Proposal";
import { AuthService } from "../utils/AuthService";
import { ProposalService } from "../utils/ProposalService";
import { RestBuilder } from "../utils/RestBuilder";
import { Participant } from "../dto/entities/Participant";
import { BreakMode } from "../dto/entities/BreakMode";
import CreateProposalForm from "./CreateProposalForm";

function ProposalComponent() {
    const [scheduleDay, setScheduleDay] = useState<ScheduleDay>(new ScheduleDay());
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [participantsError, setParticipantsError] = useState(false);
    const permission = AuthService.getAuthentication()?.allowPairSelection ?? AuthService.getParticipant()?.allowPairSelection;
    const allowPairSelection = permission === true || permission === 1;
    const groupPermission = AuthService.getAuthentication()?.allowAlternativeGroupSelection ?? AuthService.getParticipant()?.allowAlternativeGroupSelection;
    const allowAlternativeGroupSelection = groupPermission === true || groupPermission === 1;
    const [groupUsage, setGroupUsage] = useState<{ dayName: string; alternativeGroup?: string | null }[]>([]);
    const [groupUsageLoading, setGroupUsageLoading] = useState(false);
    const [groupUsageError, setGroupUsageError] = useState(false);
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

    useEffect(() => {
        let active = true;
        if (allowPairSelection) {
            setParticipantsError(false);
            RestBuilder.setEndpoint('participants/', 'GET').request()
                .then(result => { if (active) setParticipants(result as Participant[]); })
                .catch(() => { if (active) setParticipantsError(true); });
        }
        return () => { active = false; };
    }, [allowPairSelection]);

    useEffect(() => {
        if (!allowAlternativeGroupSelection || !showForm) return;
        let active = true;
        setGroupUsageLoading(true);
        setGroupUsageError(false);
        RestBuilder.setEndpoint(`schedules/${scheduleId}/days/`, 'GET').request()
            .then(result => Promise.all((result as ScheduleDay[]).map(async day => {
                const items = await ProposalService.find(day.id as number);
                return items.map(item => ({ dayName: day.name ?? `Dzień #${day.id}`, alternativeGroup: item.alternativeGroup }));
            })))
            .then(result => { if (active) setGroupUsage(result.flat()); })
            .catch(() => { if (active) setGroupUsageError(true); })
            .finally(() => { if (active) setGroupUsageLoading(false); });
        return () => { active = false; };
    }, [allowAlternativeGroupSelection, showForm, scheduleId, dayId]);

    const participantId = AuthService.getParticipant()?.id;
    const canCreate = scheduleDay.id != null && scheduleDay.firstHour != null && scheduleDay.lastHour != null && participantId != null;

    return <>
        <h1>{scheduleDay.name}</h1>
        {!showForm && canCreate && <button className="btn btn-primary proposal-add-button" type="button" onClick={() => setShowForm(true)}>Dodaj propozycję</button>}
        {participantsError && <p role="alert">Nie udało się pobrać uczestników do pary. Odśwież stronę, aby spróbować ponownie.</p>}
        {showForm && canCreate && <CreateProposalForm
            allowAlternativeGroupSelection={allowAlternativeGroupSelection} proposals={proposals}
            groupUsage={groupUsage} groupUsageLoading={groupUsageLoading} groupUsageError={groupUsageError}
            allowPairSelection={allowPairSelection} participants={participants}
            firstHour={scheduleDay.firstHour as number} lastHour={scheduleDay.lastHour as number}
            participantId={participantId as number} scheduleDayId={scheduleDay.id as number}
            onCancel={() => setShowForm(false)}
            onSubmit={async request => { await ProposalService.create(request); await refreshProposals(); setShowForm(false); }} />}
        <table>
            <thead><tr><th>Czas</th>{allowAlternativeGroupSelection && <th>Grupa propozycji</th>}<th>Długość służby</th><th>Przerwa</th>{allowPairSelection && <th>Uczestnik do pary</th>}<th /></tr></thead>
            <tbody>{proposals.map(item => <tr key={item.id}>
                <td>{item.hourStart == null || item.hourEnd == null ? '-' : `${item.hourStart}:00 - ${item.hourEnd + 1}:00`}</td>{allowAlternativeGroupSelection && <td>{item.alternativeGroup || '-'}</td>}<td>{item.serviceLengthStart}-{item.serviceLengthEnd}</td>
                <td>{item.breakMode === BreakMode.None ? 'Bez przerwy' : item.breakMode === BreakMode.Required ? 'Z przerwą' : item.breakMode === BreakMode.Optional ? 'Obojętnie' : '-'}{item.breakMode !== BreakMode.None && item.breakLengthStart != null && ` (${item.breakLengthStart}-${item.breakLengthEnd})`}</td>
                {allowPairSelection && <td>{item.pairParticipantId == null ? 'Obojętnie' : participants.find(participant => participant.id === item.pairParticipantId)?.name ?? `Uczestnik #${item.pairParticipantId}`}</td>}
                <td><button className="btn btn-link p-0" type="button" onClick={() => ProposalService.delete(item.id as number).then(refreshProposals)}>Usuń</button></td>
            </tr>)}</tbody>
        </table>
    </>;
}

export default ProposalComponent;
