import { BreakMode } from "../entities/BreakMode";

export class CreateProposalRequest {
    public alternativeGroup!: string | null;
    public pairParticipantId!: number | null;
    public breakMode!: BreakMode;
    public participantId!: number;
    public scheduleDayId!: number;
    public hourStart!: number;
    public hourEnd!: number;
    public serviceLengthStart!: number;
    public serviceLengthEnd!: number;
    public breakLengthStart?: number;
    public breakLengthEnd?: number;
}
