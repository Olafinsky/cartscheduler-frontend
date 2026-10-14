import { useEffect, useState } from "react";
import { RestBuilder } from "../utils/RestBuilder";
import { Schedule } from "../dto/entities/Schedule";
import { useParams } from "react-router-dom";
import { ScheduleDay } from "../dto/entities/ScheduleDay";
import { AuthService } from "../utils/AuthService";
import { ProposalService } from "../utils/ProposalService";

function ScheduleDays() {

    const [schedule, setSchedule] = useState<Schedule>(new Schedule());
    const [scheduleDays, setScheduleDays] = useState<Array<ScheduleDay>>([]);
    const [daysWithProposals, setDaysWithProposals] = useState<Set<number>>(new Set());
    const participantId = AuthService.getParticipant()?.id;
    let { scheduleId } = useParams();

     useEffect(() => {
        let active = true;
        setDaysWithProposals(new Set());
        RestBuilder.setEndpoint(`schedules/${scheduleId}/`, 'GET')
            .request()
            .then(result => {
                if (active) setSchedule(result as Schedule);
            })

        RestBuilder.setEndpoint(`schedules/${scheduleId}/days/`, 'GET')
            .request()
            .then(result => {
                if (!active) return;
                const days = result as ScheduleDay[];
                setScheduleDays(days);
                if (participantId == null) return;
                days.forEach(day => {
                    if (day.id == null) return;
                    const dayId = day.id;
                    ProposalService.find(dayId, participantId)
                        .then(proposals => {
                            if (active && proposals.length > 0) {
                                setDaysWithProposals(previous => new Set([...previous, dayId]));
                            }
                        })
                        .catch(error => console.error('Nie udało się pobrać propozycji dla dnia', dayId, error));
                });
            })
        return () => { active = false; };
    }, [scheduleId, participantId]);



    return (
        <>
        <h1>{schedule.name}</h1>
        {
            scheduleDays.map((item) => (
                <span key={item.id}>{item.id != null && daysWithProposals.has(item.id) && '+ '}<a href={`/schedule/${schedule.id}/day/${item.id}`}>{item.name}</a><br /></span>
            ))
        }
        </>
    )
    ;
}

export default ScheduleDays
