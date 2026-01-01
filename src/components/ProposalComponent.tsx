import { useEffect, useState } from "react";
import { RestBuilder } from "../utils/RestBuilder";
import { useParams } from "react-router-dom";
import { ScheduleDay } from "../dto/entities/ScheduleDay";
import { Proposal } from "../dto/entities/Proposal";
import { ProposalService } from "../utils/ProposalService";

function ProposalComponent() {

    const [scheduleDay, setScheduleDay] = useState<ScheduleDay>(new ScheduleDay);
    const [proposals, setProposals] = useState<Array<Proposal>>([]);
    
    let { dayId, scheduleId } = useParams();

     useEffect(() => {
        RestBuilder.setEndpoint(`schedules/${scheduleId}/days/${dayId}/`, 'GET')
            .request()
            .then(result => {
                setScheduleDay(result as ScheduleDay);
            });

        ProposalService.find(scheduleId as string)
            .then(proposals => setProposals(proposals));

    }, []);

    let deleteProposal = (id: number) => {
        ProposalService.delete(id)
            .then(() => {
                ProposalService.find(scheduleId as string)
                    .then(proposals => setProposals(proposals));
            })
    }

    return (
        <>
        <h1>{scheduleDay.name}</h1>
       
        <table>
            <thead>
                <tr>
                    <th>Czas</th>
                    <th>Długość służby</th>
                    <th>Przerwa</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {
                    proposals.map((item) => (
                        <tr key={item.id}>
                            <td>{item.hourStart}-{item.hourEnd}</td>
                            <td>{item.serviceLengthStart}-{item.serviceLengthEnd}</td>
                            <td>{item.breakLengthStart}-{item.breakLengthStart}</td>
                            <td onClick={() => deleteProposal(item.id as number)}>Usuń</td>
                        </tr>
                    ))
                }
            </tbody>
        </table>
        </>
    )
    ;
}

export default ProposalComponent