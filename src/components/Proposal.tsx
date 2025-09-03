import { useEffect, useState } from "react";
import { RestBuilder } from "../utils/RestBuilder";
import { useParams } from "react-router-dom";
import { ScheduleDay } from "../dto/entities/ScheduleDay";

function Proposal() {

    const [scheduleDay, setScheduleDay] = useState<ScheduleDay>(new ScheduleDay);
    let { dayId, scheduleId } = useParams();

     useEffect(() => {
        RestBuilder.setEndpoint(`schedules/${scheduleId}/days/${dayId}/`, 'GET')
            .request()
            .then(result => {
                setScheduleDay(result as ScheduleDay);
            })
    }, []);



    return (
        <>
        <h1>{scheduleDay.name}</h1>
       
        </>
    )
    ;
}

export default Proposal