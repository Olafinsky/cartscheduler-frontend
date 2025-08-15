import { RestAuthResponse } from "../dto/response/RestAuthResponse";
import { RestBuilder } from "./RestBuilder";

export class AuthService {

    static tokenValidityLeeway: 1000 = 1000;

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
        let authenticationString = localStorage.getItem('authentication');
        if (authenticationString == null) {
            return null;
        }
        try {
            return JSON.parse(authenticationString) as RestAuthResponse;
        }
        catch (e) {
            return null;
        }
    }

    static setAuthentication(authentication: RestAuthResponse): void {
        localStorage.setItem('authentication', JSON.stringify(authentication));
    }

    static storeInvitationToken(invitationToken: string): void {
        localStorage.setItem('invitation_token', invitationToken);
    }

    static getInvitationToken(): string|null {
        return localStorage.getItem('invitation_token');
    }
}