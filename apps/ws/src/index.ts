import { WebSocketServer } from "ws";
import { User } from "./User";

const wss = new WebSocketServer({ port: 3001 });

wss.on('connection', function connection(ws) {
  console.log("[WS Server] New client connected");
  let user = new User(ws);
  
  ws.on('error', (err) => {
    console.error("[WS Server] Socket error:", err);
  });

  ws.on('close', () => {
    console.log("[WS Server] Client disconnected");
    user.destroy()
  });
});