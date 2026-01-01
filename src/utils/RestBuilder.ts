import { UnauthenticatedError } from "../errors/UnauthenticatedError";
import { backend_uri } from "../config/params.json"
import { AuthService } from "./AuthService";

export class RestBuilder {

    endpoint?: string;
    method?: string;
    authenticated: boolean = true;
    jsonResponseBody: boolean = true;

    private constructor() {};

    static setEndpoint(endpoint: string, method: string): RestBuilder {
        let instance = new RestBuilder();
        
        instance.endpoint = endpoint;
        instance.method = method;

        return instance;
    }

    nonAuthenticated(): RestBuilder {
        this.authenticated = false;

        return this;
    }

    nonJsonResponse(): RestBuilder {
        this.jsonResponseBody = false;

        return this;
    }


    async request<T>(requestBody?: T): Promise<any> {

        if (this.authenticated) {
            if (!AuthService.isAuthenticated()) {
               
                try {
                    await AuthService.login();
                }
                catch (error: any) {
                    throw new UnauthenticatedError(`Could not log in: ${error.message ?? ''}`);
                }
            }
        }

        let payload = {
            method: this.method,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
        } as any;
        let authorization = AuthService.getAuthentication()?.jwtToken;

        if (requestBody != null) {
            payload.body = JSON.stringify(requestBody)
        }
        if (authorization != null && this.authenticated) {
            payload.headers['Authorization'] = `Bearer ${AuthService.getAuthentication()?.jwtToken}`;
        }

        return await new Promise((resolve, reject) => {
            fetch(`${backend_uri}/${this.endpoint}`, payload)
                .then(response => this.jsonResponseBody ? response.json() : response.blob)
                .then(
                    response => {
                        resolve(response);
                    },
                    error => {
                        reject(error);
                    }
                )
        });
    }
}