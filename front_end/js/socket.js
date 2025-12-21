export class SocketClient {
    constructor(url, onMessage) {
        this.url = url;
        this.onMessage = onMessage;
        this.ws = null;
    }

    connect(token) {
        if (!token) return;
        // Close existing if any
        if (this.ws) this.ws.close();

        this.ws = new WebSocket(`${this.url}?token=${token}`);

        this.ws.onopen = () => console.log("WS Connected");

        this.ws.onmessage = (event) => {
            console.log("WS Message:", event.data);
            if (this.onMessage) this.onMessage(event.data);
        };

        this.ws.onclose = () => {
            console.log("WS Closed. Reconnecting in 5s...");
            setTimeout(() => this.connect(token), 5000);
        };
    }
}
