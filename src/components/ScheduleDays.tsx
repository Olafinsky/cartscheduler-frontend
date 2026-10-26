import { useEffect, useState } from "react";
import { RestBuilder } from "../utils/RestBuilder";
import { Schedule } from "../dto/entities/Schedule";
import { Link, useParams } from "react-router-dom";
import { ScheduleDay } from "../dto/entities/ScheduleDay";
import { AuthService } from "../utils/AuthService";

function ScheduleDays() {

    const [schedule, setSchedule] = useState<Schedule>(new Schedule());
    const [scheduleDays, setScheduleDays] = useState<Array<ScheduleDay>>([]);
    const participantId = AuthService.getParticipant()?.id;
    const { scheduleId } = useParams();

    useEffect(() => {
        let active = true;
        setScheduleDays([]);
        RestBuilder.setEndpoint(`schedules/${scheduleId}/`, 'GET')
            .request()
            .then(result => {
                if (active) setSchedule(result as Schedule);
            })

        const participantQuery = participantId == null ? '' : `?participantId=${participantId}`;
        RestBuilder.setEndpoint(`schedules/${scheduleId}/days/${participantQuery}`, 'GET')
            .request()
            .then(result => {
                if (!active) return;
                const days = result as ScheduleDay[];
                setScheduleDays(days);
            })
        return () => { active = false; };
    }, [scheduleId, participantId]);

    const weekdays = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'];
    const groupedDays = weekdays.map((weekday, index) => ({ weekday, days: scheduleDays.filter(day => {
        const date = day.date;
        return date ? (new Date(date + 'T12:00:00').getDay() + 6) % 7 === index : day.name?.toLocaleLowerCase('pl').includes(weekday.toLocaleLowerCase('pl'));
    }).sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '')) })).filter(column => column.days.length > 0);
    const ungrouped = scheduleDays.filter(day => !groupedDays.some(column => column.days.includes(day)));
    if (ungrouped.length) groupedDays.push({ weekday: 'Pozostałe dni', days: ungrouped });
    return <>
        <div className="page-heading"><p className="eyebrow">Twój harmonogram</p><h1>{schedule.name}</h1><p>Wybierz dzień i dodaj swoją propozycję godzin.</p></div>
        <p className="schedule-legend"><span className="status-dot" aria-hidden="true" /> Dzień z Twoją propozycją</p>
        <div className="schedule-scroll"><div className="schedule-grid">{groupedDays.map(({ weekday, days }) => <section className="weekday-column" key={weekday} aria-label={weekday}><h2>{weekday}</h2>{days.map(day => {
            const complete = day.hasProposals === true;
            const date = day.date?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            return <div className="day-card-wrapper" key={day.id}><Link className={'day-card' + (complete ? ' day-card--complete' : '')} to={'/schedule/' + schedule.id + '/day/' + day.id} aria-label={day.name}>{date ? <><span className="day-card__number">{date[3]}</span><span>{date[3]}.{date[2]}.{date[1]}</span></> : <span>{day.name}</span>}</Link>{complete && <span className="day-check" role="img" aria-label="Dodano propozycję">✓</span>}</div>;
        })}</section>)}</div></div>
    </>;
}
export default ScheduleDays;
