import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ScheduleDay } from "../dto/entities/ScheduleDay";
import { Proposal } from "../dto/entities/Proposal";
import { AuthService } from "../utils/AuthService";
import { ProposalService } from "../utils/ProposalService";
import { RestBuilder } from "../utils/RestBuilder";
import { Participant } from "../dto/entities/Participant";
import { BreakMode } from "../dto/entities/BreakMode";
import { ProposalPrefill } from "../dto/entities/ProposalPrefill";
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
    const [prefill, setPrefill] = useState<ProposalPrefill | null>(null);
    const [prefillError, setPrefillError] = useState(false);
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
    useEffect(() => {
        setPrefill(null);
        setPrefillError(false);
        if (dayId == null || participantId == null) return;
        let active = true;
        ProposalService.prefill(dayId, participantId)
            .then(result => { if (active) setPrefill(result); })
            .catch(() => { if (active) setPrefillError(true); });
        return () => { active = false; };
    }, [showForm, dayId, participantId, proposals]);

    const canCreate = scheduleDay.id != null && scheduleDay.firstHour != null && scheduleDay.lastHour != null && participantId != null;

    return <>
        <div className="page-heading"><p className="eyebrow">Propozycje służby</p><h1>{scheduleDay.name}</h1><p>Zaplanuj swoją dostępność na ten dzień.</p></div>
        {!showForm && canCreate && <button className="btn btn-primary proposal-add-button" type="button" onClick={() => setShowForm(true)}>Dodaj propozycję</button>}
        {participantsError && <p role="alert">Nie udało się pobrać uczestników do pary. Odśwież stronę, aby spróbować ponownie.</p>}
        {showForm && canCreate && <CreateProposalForm
            key={dayId + ":" + participantId} prefill={prefill} prefillError={prefillError}
            allowAlternativeGroupSelection={allowAlternativeGroupSelection} proposals={proposals}
            groupUsage={groupUsage} groupUsageLoading={groupUsageLoading} groupUsageError={groupUsageError}
            allowPairSelection={allowPairSelection} participants={participants}
            firstHour={scheduleDay.firstHour as number} lastHour={scheduleDay.lastHour as number}
            participantId={participantId as number} scheduleDayId={scheduleDay.id as number}
            onCancel={() => setShowForm(false)}
            onSubmit={async request => { await ProposalService.create(request); await refreshProposals(); setShowForm(false); }} />}
        <div className="proposal-table-wrapper"><table className="proposal-table">
            <thead><tr><th>Godziny</th><th>Długość służby</th><th>Przerwa</th>{allowPairSelection && <th>Uczestnik do pary</th>}{allowAlternativeGroupSelection && <th>Grupa propozycji</th>}<th><span className="visually-hidden">Akcje</span></th></tr></thead>
            <tbody>{proposals.map(item => <tr key={item.id}>
                <td>{item.hourStart == null || item.hourEnd == null ? '-' : `${item.hourStart}:00 - ${item.hourEnd + 1}:00`}</td><td>{item.serviceLengthStart}-{item.serviceLengthEnd}</td>
                <td>{item.breakMode === BreakMode.None ? 'Bez przerwy' : item.breakMode === BreakMode.Required ? 'Z przerwą' : item.breakMode === BreakMode.Optional ? 'Obojętnie' : '-'}{item.breakMode !== BreakMode.None && item.breakLengthStart != null && ` (${item.breakLengthStart}-${item.breakLengthEnd})`}</td>
                {allowPairSelection && <td>{item.pairParticipantId == null ? 'Obojętnie' : participants.find(participant => participant.id === item.pairParticipantId)?.name ?? `Uczestnik #${item.pairParticipantId}`}</td>}
                {allowAlternativeGroupSelection && <td>{item.alternativeGroup || '-'}</td>}<td><button className="delete-button" aria-label="Usuń propozycję" title="Usuń propozycję" type="button" onClick={() => ProposalService.delete(item.id as number).then(refreshProposals)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6" /></svg></button></td>
            </tr>)}</tbody>
        </table></div>{proposals.length === 0 && !showForm && <p className="empty-state">Nie masz jeszcze propozycji na ten dzień. Dodaj pierwszą propozycję, aby wskazać swoją dostępność.</p>}
    </>;
}

export default ProposalComponent;
