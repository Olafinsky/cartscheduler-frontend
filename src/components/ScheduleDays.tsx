import { useEffect, useState } from "react";
import { RestBuilder } from "../utils/RestBuilder";
import { Schedule } from "../dto/entities/Schedule";
import { useParams } from "react-router-dom";
import { ScheduleDay } from "../dto/entities/ScheduleDay";

function ScheduleDays() {

    const [schedule, setSchedule] = useState<Schedule>(new Schedule());
    const [scheduleDays, setScheduleDays] = useState<Array<ScheduleDay>>([]);
    let { scheduleId } = useParams();

     useEffect(() => {
        RestBuilder.setEndpoint(`schedules/${scheduleId}/`, 'GET')
            .request()
            .then(result => {
                setSchedule(result as Schedule);
            })

        RestBuilder.setEndpoint(`schedules/${scheduleId}/days/`, 'GET')
            .request()
            .then(result => {
                setScheduleDays(result as ScheduleDay[]);
            })
    }, []);



    return (
        <>
        <h1>{schedule.name}</h1>
        {
            scheduleDays.map((item) => (
                <span key={item.id}><a href={`/schedule/${schedule.id}/day/${item.id}`}>{item.name}</a><br /></span>
            ))
        }
        </>
    )
    ;
}

export default ScheduleDays