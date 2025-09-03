import { Participant } from "../dto/entities/Participant";
import { RestAuthResponse } from "../dto/response/RestAuthResponse";
import { RestBuilder } from "./RestBuilder";

export class AuthService {

    static tokenValidityLeeway: 1000 = 1000;

    private static authentication: RestAuthResponse | null = null;
    private static participant: Participant | null = null;
    private static invitationToken: string | null = null;
    private static participantListeners = new Set<() => void>(); 

    static login(): Promise<RestAuthResponse|null> {
        return new Promise((resolve, reject) => {

            RestBuilder.setEndpoint('auth/', 'POST')
                .nonAuthenticated()
                .request({
                    invitationToken: this.getInvitationToken()
                })
                .then(
                    response => {
                        this.setAuthentication(response);
                        resolve(response as RestAuthResponse);
                    },
                    error => {
                        reject(error);
                    }
                );
        })
       
    }

    static isAuthenticated(): boolean {
        let authentication = this.getAuthentication();
        if (authentication == null || authentication.jwtToken == null || authentication.expiresAt == null) {
            return false;
        }
        
        return (authentication.expiresAt - this.tokenValidityLeeway) > (new Date).getTime();
    }

    static getAuthentication(): RestAuthResponse|null {
        return this.authentication ?? this.getJsonFromSession<RestAuthResponse>('authentication');
    }

    static setAuthentication(authentication: RestAuthResponse): void {
        sessionStorage.setItem('authentication', JSON.stringify(authentication));
        this.authentication = authentication;
    }

    static storeInvitationToken(invitationToken: string): void {
        sessionStorage.setItem('invitation_token', invitationToken);
        this.invitationToken = invitationToken;
    }

    static getInvitationToken(): string|null {
        return this.invitationToken ?? sessionStorage.getItem('invitation_token');
    }

    static setParticipant(participant: Participant): void {
        sessionStorage.setItem('participant', JSON.stringify(participant));
        this.participant = participant;
        for (const listener of this.participantListeners) listener();
    }

    static getParticipant(): Participant|null {
        return this.participant ?? this.getJsonFromSession<Participant>('participant');
    }

    static subscribeParticipant(listener: () => void): () => void {
        this.participantListeners.add(listener);
        return () => this.participantListeners.delete(listener);
    }

    private static getJsonFromSession<T>(key: string): T|null {
         let result = sessionStorage.getItem(key);
        if (result == null) {
            return null;
        }
        try {
            return JSON.parse(result) as T;
        }
        catch (e) {
            return null;
        }
    }
}