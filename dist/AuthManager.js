"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthManager = void 0;
const http_1 = __importDefault(require("http"));
class AuthManager {
    static sendAuthRequestURL(log, client_id, client_secret, hostname) {
        log.info("Please visit the following URL to authorize this plugin:");
        log.info(AuthManager.AUTH_URL + "?client_id=" + client_id + "&scope=read_smarther%20write_smarther&state=netatmo-homepluscontrol&redirect_uri=http://" + hostname + ":18499/callback");
        this.logger = log;
        this.client_id = client_id;
        this.client_secret = client_secret;
        this.hostname = hostname;
        this.createAuthServer(log);
    }
    static createAuthServer(log) {
        this.authServer = http_1.default.createServer(this.handleRequest.bind(this));
        this.authServer.listen(18499, () => {
            log.info("Auth server listening on port 18499");
        });
    }
    static handleRequest(request, response) {
        var _a, _b;
        if ((_a = request.url) === null || _a === void 0 ? void 0 : _a.startsWith("/callback")) {
            const url = new URL(request.url, "http://localhost:18499");
            const code = url.searchParams.get("code");
            const state = url.searchParams.get("state");
            if (code != null && state != null && state === "netatmo-homepluscontrol") {
                response.writeHead(200, { 'Content-Type': 'text/html' });
                response.write("<html><head><title>Netatmo Home+ Control</title></head><body><h1>Netatmo Home+ Control</h1><p>Authorization successful. Please close this window.</p></body></html>");
                response.end();
                (_b = this.authServer) === null || _b === void 0 ? void 0 : _b.close();
                this.authCode = code;
                console.log("Got auth token: " + this.getAuthTokenFromCode(this.logger, this.client_id, this.client_secret, this.hostname));
            }
        }
    }
    static async getAuthTokenFromCode(log, client_id, client_secret, hostname) {
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
        });
        const data = await request.json();
        if (data.error != null) {
            log.error("Error while getting auth token: " + data.error);
            throw new Error("Error while getting auth token: " + data.error);
        }
        else {
            this.token = data.access_token;
            this.refreshToken = data.refresh_token;
            return data.access_token;
        }
    }
}
exports.AuthManager = AuthManager;
AuthManager.AUTH_URL = "https://api.netatmo.com/oauth2/authorize";
//# sourceMappingURL=AuthManager.js.map