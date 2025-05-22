class WebSocketHandler{

    constructor(){
        this.subscribers= [];
        this.socket = null;
    }
    connect() {
        // Use the IP or hostname that the browser can reach.
        this.socket = new WebSocket("ws://192.168.137.121:8000/ws");
    
        this.socket.onopen = () => {
          console.log("WebSocket connection established.");
        };
    
        this.socket.onerror = (error) => {
          console.error("WebSocket encountered an error:", error);
        };
    
        // Log when the socket is closed to get the event information
        this.socket.onclose = (event) => {
          console.log("WebSocket closed:", event);
        };
    
        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.dispatch(data);
          } catch (err) {
            console.error("Error parsing message:", err);
          }
        };
      }
    subscribe(callback){
        this.subscribers.push(callback);
        return () => {
            this.subscribers = this.subscribers.filter(sub => sub!==callback);
        };
    }
    dispatch(data){
        this.subscribers.forEach((callback) => callback(data));
    }
}
export const webSocketHandler =new WebSocketHandler();