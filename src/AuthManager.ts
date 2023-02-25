import http, {IncomingMessage, Server, ServerResponse} from "http";
import {Logger} from "homebridge";


export class AuthManager {
    private static readonly AUTH_URL = "https://api.netatmo.com/oauth2/authorize";

    private static authServer?: Server;
    private static authCode?: string;

    static token?: string;
    static refreshToken?: string;

    private static logger: Logger;

    private static client_id: string;
    private static client_secret: string;
    private static hostname: string;

    static sendAuthRequestURL(log: Logger, client_id: string, client_secret: string, hostname: string): void {
        log.info("Please visit the following URL to authorize this plugin:");
        log.info(AuthManager.AUTH_URL + "?client_id=" + client_id + "&scope=read_smarther%20write_smarther&state=netatmo-homepluscontrol&redirect_uri=http://" + hostname +":18499/callback");
        this.logger = log;
        this.client_id = client_id;
        this.client_secret = client_secret;
        this.hostname = hostname;
        this.createAuthServer(log);
    }

    static createAuthServer(log: Logger) {
        this.authServer = http.createServer(this.handleRequest.bind(this));
        this.authServer.listen(18499, () => {
            log.info("Auth server listening on port 18499");
        });
    }

    private static handleRequest(request: IncomingMessage, response: ServerResponse) {
        if (request.url?.startsWith("/callback")) {
            const url = new URL(request.url, "http://localhost:18499");
            const code = url.searchParams.get("code");
            const state = url.searchParams.get("state");
            if (code != null && state != null && state === "netatmo-homepluscontrol") {
                response.writeHead(200, {'Content-Type': 'text/html'});
                response.write("<html><head><title>Netatmo Home+ Control</title></head><body><h1>Netatmo Home+ Control</h1><p>Authorization successful. Please close this window.</p></body></html>");
                response.end();
                this.authServer?.close();

                this.authCode = code;
                console.log("Got auth token: " + this.getAuthTokenFromCode(this.logger, this.client_id, this.client_secret, this.hostname));
            }
        }
    }

    private static async getAuthTokenFromCode(log: Logger, client_id: string, client_secret: string, hostname: string): Promise<string> {
        const request = await fetch("https://api.netatmo.com/oauth2/token", {
            method: "POST",
            body: JSON.stringify({
                grant_type: "authorization_code",
                client_id: client_id,
                client_secret: client_secret,
                code: this.authCode,
                redirect_uri: "http://" + hostname + ":18499/callback",
                scope: "read_smarther write_smarther"
            }),
            headers: {
                "Content-Type": "application/json"
            }
        })
        const data = await request.json();
        if (data.error != null) {
            log.error("Error while getting auth token: " + data.error);
            throw new Error("Error while getting auth token: " + data.error);
        } else {
            this.token = data.access_token;
            this.refreshToken = data.refresh_token;
            return data.access_token;
        }
    }


}