export class RestAuthResponse {
    public allowAlternativeGroupSelection?: boolean | 0 | 1;
    public allowPairSelection?: boolean | 0 | 1;
    public jwtToken?: string;
    public expiresAt?: number;
    public scheduleId?: number;
}
