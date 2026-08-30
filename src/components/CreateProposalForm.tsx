import { useMemo, useState } from "react";
import { CreateProposalRequest } from "../dto/request/CreateProposalRequest";

type Props = { firstHour: number; lastHour: number; participantId: number; scheduleDayId: number; onCancel: () => void; onSubmit: (request: CreateProposalRequest) => Promise<void> };
const range = (from: number, to: number) => Array.from({ length: Math.max(0, to - from + 1) }, (_, index) => from + index);

function CreateProposalForm({ firstHour, lastHour, participantId, scheduleDayId, onCancel, onSubmit }: Props) {
    const [hourStart, setHourStart] = useState(firstHour);
    const [hourTo, setHourTo] = useState(firstHour + 1);
    const [serviceLengthStart, setServiceLengthStart] = useState(1);
    const [serviceLengthEnd, setServiceLengthEnd] = useState(1);
    const [wantsBreak, setWantsBreak] = useState(false);
    const [breakLengthStart, setBreakLengthStart] = useState(1);
    const [breakLengthEnd, setBreakLengthEnd] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const duration = hourTo - hourStart;
    const maxBreakLength = duration - serviceLengthStart;
    const canHaveBreak = maxBreakLength >= 1;
    const startHours = useMemo(() => range(firstHour, lastHour), [firstHour, lastHour]);
    const endHours = useMemo(() => range(hourStart + 1, lastHour + 1), [hourStart, lastHour]);

    const normalizeLengths = (nextDuration: number, nextServiceStart: number) => {
        setServiceLengthStart(nextServiceStart);
        setServiceLengthEnd(Math.max(nextServiceStart, Math.min(serviceLengthEnd, nextDuration)));
        const nextMaxBreak = nextDuration - nextServiceStart;
        if (nextMaxBreak < 1) setWantsBreak(false);
        setBreakLengthStart(Math.min(breakLengthStart, Math.max(1, nextMaxBreak)));
        setBreakLengthEnd(Math.min(breakLengthEnd, Math.max(1, nextMaxBreak)));
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
        setServiceLengthStart(value); setServiceLengthEnd(Math.max(value, serviceLengthEnd));
        const nextMaxBreak = duration - value;
        if (nextMaxBreak < 1) setWantsBreak(false);
        setBreakLengthStart(Math.min(breakLengthStart, Math.max(1, nextMaxBreak)));
        setBreakLengthEnd(Math.min(breakLengthEnd, Math.max(1, nextMaxBreak)));
    };
    const changeBreakStart = (value: number) => { setBreakLengthStart(value); setBreakLengthEnd(Math.max(value, breakLengthEnd)); };
    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        const request: CreateProposalRequest = { participantId, scheduleDayId, hourStart, hourEnd: hourTo - 1, serviceLengthStart, serviceLengthEnd,
            ...(wantsBreak && canHaveBreak ? { breakLengthStart, breakLengthEnd } : {}) };
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
                <label>DO <select aria-label="Długość służby do" value={serviceLengthEnd} onChange={e => setServiceLengthEnd(Number(e.target.value))}>{range(serviceLengthStart, duration).map(v => <option key={v} value={v}>{v}</option>)}</select></label>
            </fieldset>
        </div>
        {canHaveBreak && <label className="proposal-form__break-toggle"><input type="checkbox" checked={wantsBreak} onChange={e => setWantsBreak(e.target.checked)} /> Chcę przerwę</label>}
        {wantsBreak && canHaveBreak && <fieldset><legend>Długość przerwy</legend>
            <label>OD <select aria-label="Długość przerwy od" value={breakLengthStart} onChange={e => changeBreakStart(Number(e.target.value))}>{range(1, maxBreakLength).map(v => <option key={v} value={v}>{v}</option>)}</select></label>
            <label>DO <select aria-label="Długość przerwy do" value={breakLengthEnd} onChange={e => setBreakLengthEnd(Number(e.target.value))}>{range(breakLengthStart, maxBreakLength).map(v => <option key={v} value={v}>{v}</option>)}</select></label>
        </fieldset>}
        <div className="proposal-form__actions"><button className="btn btn-primary" type="submit" disabled={submitting}>Dodaj</button><button className="btn btn-outline-secondary" type="button" onClick={onCancel} disabled={submitting}>Anuluj</button></div>
    </form>;
}
export default CreateProposalForm;
