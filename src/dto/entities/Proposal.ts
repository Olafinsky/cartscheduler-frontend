import { BreakMode } from "./BreakMode";


export class Proposal {
    public alternativeGroup?: string | null;
    public pairParticipantId?: number | null;
    public breakMode?: BreakMode;
    public id?: number;
    public hourStart?: number;
    public hourEnd?: number;
    public breakLengthStart?: number;
    public breakLengthEnd?: number;
    public serviceLengthStart?: number;
    public serviceLengthEnd?: number;
}
