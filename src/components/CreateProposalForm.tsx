import { useId, useMemo, useState } from "react";
import { CreateProposalRequest } from "../dto/request/CreateProposalRequest";
import { BreakMode } from "../dto/entities/BreakMode";
import { Proposal } from "../dto/entities/Proposal";
import { Participant } from "../dto/entities/Participant";

type Props = { allowAlternativeGroupSelection?: boolean; proposals?: Proposal[]; groupUsage?: { dayName: string; alternativeGroup?: string | null }[]; groupUsageLoading?: boolean; groupUsageError?: boolean; allowPairSelection?: boolean; participants?: Participant[]; firstHour: number; lastHour: number; participantId: number; scheduleDayId: number; onCancel: () => void; onSubmit: (request: CreateProposalRequest) => Promise<void> };
const range = (from: number, to: number) => Array.from({ length: Math.max(0, to - from + 1) }, (_, index) => from + index);

function CreateProposalForm({ allowAlternativeGroupSelection = false, proposals = [], groupUsage = [], groupUsageLoading = false, groupUsageError = false, allowPairSelection = false, participants = [], firstHour, lastHour, participantId, scheduleDayId, onCancel, onSubmit }: Props) {
    const [alternativeGroup, setAlternativeGroup] = useState('');
    const group = allowAlternativeGroupSelection ? alternativeGroup.trim() || null : null;
    const groupDescriptionId = useId();
    const usedDays = [...new Set(groupUsage.filter(item => item.alternativeGroup?.trim() === group).map(item => item.dayName))];
    const [hourStart, setHourStart] = useState(firstHour);
    const [hourTo, setHourTo] = useState(firstHour + 1);
    const [serviceLengthStart, setServiceLengthStart] = useState(1);
    const [serviceLengthEnd, setServiceLengthEnd] = useState(1);
    const [breakMode, setBreakMode] = useState(BreakMode.None);
    const [pairParticipantId, setPairParticipantId] = useState<number | null>(null);
    const breakModeName = useId();
    const [breakLengthStart, setBreakLengthStart] = useState(1);
    const [breakLengthEnd, setBreakLengthEnd] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const duration = hourTo - hourStart;
    const overlaps = proposals.some(proposal => proposal.hourStart != null && proposal.hourEnd != null
        && hourStart <= proposal.hourEnd && hourTo > proposal.hourStart
        && !(group && proposal.alternativeGroup?.trim() === group));
    const maxBreakLength = duration - Math.max(2, serviceLengthStart);
    const canHaveBreak = serviceLengthEnd > 1 && maxBreakLength >= 1;
    const startHours = useMemo(() => range(firstHour, lastHour), [firstHour, lastHour]);
    const endHours = useMemo(() => range(hourStart + 1, lastHour + 1), [hourStart, lastHour]);

    const normalizeBreakLengths = (nextDuration: number, nextServiceStart: number, nextServiceEnd: number) => {
        const nextMaxBreak = nextDuration - Math.max(2, nextServiceStart);
        if (nextServiceEnd <= 1 || nextMaxBreak < 1) setBreakMode(BreakMode.None);
        setBreakLengthStart(Math.min(breakLengthStart, Math.max(1, nextMaxBreak)));
        setBreakLengthEnd(Math.min(breakLengthEnd, Math.max(1, nextMaxBreak)));
    };
    const normalizeLengths = (nextDuration: number, nextServiceStart: number) => {
        const nextServiceEnd = Math.max(nextServiceStart, Math.min(serviceLengthEnd, nextDuration));
        setServiceLengthStart(nextServiceStart);
        setServiceLengthEnd(nextServiceEnd);
        normalizeBreakLengths(nextDuration, nextServiceStart, nextServiceEnd);
    };
    const changeHourStart = (value: number) => {
        const nextHourTo = Math.max(hourTo, value + 1);
        const nextDuration = nextHourTo - value;
        setHourStart(value); setHourTo(nextHourTo);
        normalizeLengths(nextDuration, Math.min(serviceLengthStart, nextDuration));
    };
    const changeHourTo = (value: number) => {
        const nextDuration = value - hourStart;
        setHourTo(value); normalizeLengths(nextDuration, Math.min(serviceLengthStart, nextDuration));
    };
    const changeServiceStart = (value: number) => {
        const nextServiceEnd = Math.max(value, serviceLengthEnd);
        setServiceLengthStart(value);
        setServiceLengthEnd(nextServiceEnd);
        normalizeBreakLengths(duration, value, nextServiceEnd);
    };
    const changeServiceEnd = (value: number) => {
        setServiceLengthEnd(value);
        normalizeBreakLengths(duration, serviceLengthStart, value);
    };
    const changeBreakStart = (value: number) => { setBreakLengthStart(value); setBreakLengthEnd(Math.max(value, breakLengthEnd)); };
    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (overlaps || submitting) return;
        const request: CreateProposalRequest = { alternativeGroup: group, participantId, scheduleDayId, hourStart, hourEnd: hourTo - 1, serviceLengthStart, serviceLengthEnd,
            breakMode: canHaveBreak ? breakMode : BreakMode.None,
            pairParticipantId: allowPairSelection ? pairParticipantId : null,
            ...(breakMode !== BreakMode.None && canHaveBreak ? { breakLengthStart, breakLengthEnd } : {}) };
        setSubmitting(true);
        try { await onSubmit(request); } finally { setSubmitting(false); }
    };

    return <form className="proposal-form" onSubmit={submit} aria-label="Dodawanie propozycji">
        <div className="proposal-form__row">
            <fieldset><legend>Służba w godzinach</legend>
                <label>OD <select aria-label="Służba od" value={hourStart} onChange={e => changeHourStart(Number(e.target.value))}>{startHours.map(v => <option key={v} value={v}>{v}:00</option>)}</select></label>
                <label>DO <select aria-label="Służba do" value={hourTo} onChange={e => changeHourTo(Number(e.target.value))}>{endHours.map(v => <option key={v} value={v}>{v}:00</option>)}</select></label>
            </fieldset>
            <fieldset><legend>Długość służby</legend>
                <label>OD <select aria-label="Długość służby od" value={serviceLengthStart} onChange={e => changeServiceStart(Number(e.target.value))}>{range(1, duration).map(v => <option key={v} value={v}>{v}</option>)}</select></label>
                <label>DO <select aria-label="Długość służby do" value={serviceLengthEnd} onChange={e => changeServiceEnd(Number(e.target.value))}>{range(serviceLengthStart, duration).map(v => <option key={v} value={v}>{v}</option>)}</select></label>
            </fieldset>
        </div>
        {allowAlternativeGroupSelection && <div className="proposal-form__group">
            <label>Grupa propozycji <input type="text" maxLength={16} size={16} value={alternativeGroup} aria-describedby={groupDescriptionId} onChange={event => setAlternativeGroup(event.target.value)} /></label>
            <div id={groupDescriptionId}>
                {group && <p role="status">{groupUsageLoading ? 'Sprawdzanie użycia grupy…' : groupUsageError ? 'Nie udało się sprawdzić użycia grupy. Odśwież stronę, aby spróbować ponownie.' : usedDays.length ? `Grupa została już użyta w dniach: ${usedDays.join(', ')}.` : 'Grupa nie była jeszcze użyta.'}</p>}
                <p>Z danej grupy zostanie wybrana tylko jedna propozycja</p>
            </div>
        </div>}
        {allowPairSelection && <fieldset><legend>Para</legend>
            <label>Uczestnik do pary <select value={pairParticipantId ?? ''} onChange={e => setPairParticipantId(e.target.value === '' ? null : Number(e.target.value))}>
                <option value="">Obojętnie</option>
                {participants.filter(participant => participant.id != null && participant.id !== participantId).map(participant => <option key={participant.id} value={participant.id}>{participant.name}</option>)}
            </select></label>
        </fieldset>}
        {canHaveBreak && <fieldset><legend>Przerwa</legend>
            {([{ value: BreakMode.None, label: 'Bez przerwy' }, { value: BreakMode.Optional, label: 'Obojętnie' }, { value: BreakMode.Required, label: 'Z przerwą' }]).map(({value, label}) => <label key={value}>
                <input type="radio" name={breakModeName} value={value} checked={breakMode === value} onChange={() => setBreakMode(value)} />{label}
            </label>)}
        </fieldset>}
        {breakMode !== BreakMode.None && canHaveBreak && <fieldset><legend>Długość przerwy</legend>
            <label>OD <select aria-label="Długość przerwy od" value={breakLengthStart} onChange={e => changeBreakStart(Number(e.target.value))}>{range(1, maxBreakLength).map(v => <option key={v} value={v}>{v}</option>)}</select></label>
            <label>DO <select aria-label="Długość przerwy do" value={breakLengthEnd} onChange={e => setBreakLengthEnd(Number(e.target.value))}>{range(breakLengthStart, maxBreakLength).map(v => <option key={v} value={v}>{v}</option>)}</select></label>
        </fieldset>}
        {overlaps && <p role="alert">Wybrane godziny nakładają się na istniejącą propozycję. {allowAlternativeGroupSelection ? 'Wybierz inne godziny lub tę samą grupę propozycji.' : 'Wybierz inne godziny.'}</p>}
        <div className="proposal-form__actions"><button className="btn btn-primary" type="submit" disabled={submitting || overlaps}>Dodaj</button><button className="btn btn-outline-secondary" type="button" onClick={onCancel} disabled={submitting}>Anuluj</button></div>
    </form>;
}
export default CreateProposalForm;
