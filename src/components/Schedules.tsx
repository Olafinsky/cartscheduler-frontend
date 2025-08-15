import { useEffect, useState } from "react";
import { RestBuilder } from "../utils/RestBuilder";
import { Schedule } from "../dto/entities/Schedule";

function Schedules() {

    const [scheduleElem, setScheduleElem] = useState('');

     useEffect(() => {

        RestBuilder.setEndpoint('schedules/', 'GET')
            .request()
            .then(result => {
                let t = '';
                for (let schedule of result as Schedule[]) {
                    t += (schedule.name + '<br>');
                }

                setScheduleElem(t);
            })
    });



    return <>
    <h1>Schedules</h1>
    {scheduleElem}
    </>
    ;
}

export default Schedules