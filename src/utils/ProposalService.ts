import { Proposal } from "../dto/entities/Proposal";
import { AuthService } from "./AuthService";
import { RestBuilder } from "./RestBuilder";
import { CreateProposalRequest } from "../dto/request/CreateProposalRequest";

export class ProposalService {
    static async create(request: CreateProposalRequest): Promise<Proposal> {
        return RestBuilder.setEndpoint('proposals', 'POST').request(request) as Promise<Proposal>;
    }

    static async delete(id: number) {
        return await new Promise<void>((resolve) => {
            RestBuilder.setEndpoint(`proposals/${id}`, 'DELETE')
                .nonJsonResponse()
                .request()
                .then(() => resolve())
        });
    }

    static async find(dayId: number|string, participantId = AuthService.getParticipant()?.id): Promise<Proposal[]> {
        return RestBuilder.setEndpoint(`proposals/schedule-day/${dayId}/participant/${participantId}`, 'GET')
            .request() as Promise<Proposal[]>;
    }
}
