export class CreateProposalRequest {
    public participantId!: number;
    public scheduleDayId!: number;
    public hourStart!: number;
    public hourEnd!: number;
    public serviceLengthStart!: number;
    public serviceLengthEnd!: number;
    public breakLengthStart?: number;
    public breakLengthEnd?: number;
}
