import { Proposal } from "../dto/entities/Proposal";
import { AuthService } from "./AuthService";
import { RestBuilder } from "./RestBuilder";

export class ProposalService {
    static async delete(id: number) {
        return await new Promise<void>((resolve) => {
            RestBuilder.setEndpoint(`proposals/${id}`, 'DELETE')
                .nonJsonResponse()
                .request()
                .then(() => resolve())
        });
    }

    static async find(scheduleId: number|string) {
        return await new Promise<Proposal[]>((resolve) =>{
            RestBuilder.setEndpoint(`proposals/schedule-day/${scheduleId}/participant/${AuthService.getParticipant()?.id}`, 'GET')
                .request()
                .then(result => {
                    resolve(result as Proposal[]);
                });
        })

       
    }
}