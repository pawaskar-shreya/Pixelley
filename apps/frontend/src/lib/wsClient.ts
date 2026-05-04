import { useAuthStore } from './store';

type MessageHandler = (data: any) => void;
interface SpaceJoinedPayload {
  spawn: { x: number; y: number };
  users: { id: string }[];
}

interface MovementPayload {                    // server broadcasting another user moved
  x: number;
  y: number;
  userId: string;
}

interface MovementRejectedPayload {           // server snapping local player back
  x: number;
  y: number;
}

interface UserJoinPayload {
  userId: string;
  x: number;
  y: number;
}

interface UserLeftPayload {
  userId: string;
}

// Internal event names used by Phaser/React consumers
// We translate raw WS message types these internal events

export type WSEvent =
  | 'connect'
  | 'disconnect'
  | 'space-joined'       // server: space-joined
  | 'user-join'          // server: user-join
  | 'user-left'          // server: user-left
  | 'movement'           // server: movement (another player moved)
  | 'movement-rejected'; // server: movement-rejected (snap local player back)

class WSClient {
  private socket: WebSocket | null = null;
  private handlers: Record<string, MessageHandler[]> = {};
  private connected = false;

  // WS Connection

  connect(url: string, spaceId: string) {
    console.log(`[WS] Connecting to ${url}...`);

    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      this.connected = true;
      console.log('[WS] Connected');
      this.emit('connect', {});

      // Send join as soon as the socket is open
      const { token } = useAuthStore.getState();
      this.sendRaw({ type: 'join', payload: { spaceId, token } });
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data as string);
        this.handleMessage(message);
      } catch (err) {
        console.error('[WS] Failed to parse message', err);
      }
    };

    this.socket.onclose = () => {
      this.connected = false;
      console.log('[WS] Disconnected');
      this.emit('disconnect', {});
    };

    this.socket.onerror = (err) => {
      console.error('[WS] Socket error', err);
    };
  }

  disconnect() {
    this.socket?.close();
    this.socket = null;
    this.connected = false;
  }

  // Message router: translates schema types -> internal events 

  private handleMessage(message: { type: string; payload: any }) {
    const { type, payload } = message;

    switch (type) {
      case 'space-joined': {
        const data = payload as SpaceJoinedPayload;
        console.log('[WS] space-joined', data);
        this.emit('space-joined', data);
        break;
      }

      case 'user-join': {
        const data = payload as UserJoinPayload;
        console.log('[WS] user-join', data);
        this.emit('user-join', data);
        break;
      }

      case 'user-left': {
        const data = payload as UserLeftPayload;
        console.log('[WS] user-left', data);
        this.emit('user-left', data);
        break;
      }

      case 'movement': {
        const data = payload as MovementPayload;
        this.emit('movement', data);
        break;
      }

      case 'movement-rejected': {
        const data = payload as MovementRejectedPayload;
        console.warn('[WS] movement-rejected: snapping back to', data);
        this.emit('movement-rejected', data);
        break;
      }

      default:
        console.warn('[WS] Unknown message type:', type);
    }
  }

  // Client -> server 

  // Called by Phaser's update loop after local player moves
  sendMovement(x: number, y: number) {
    if (!this.connected) return;
    this.sendRaw({ type: 'move', payload: { x, y } });
  }

  // Pub/sub used by Phaser scenes and React components
  on(event: WSEvent | string, handler: MessageHandler) {
    if (!this.handlers[event]) this.handlers[event] = [];
    this.handlers[event].push(handler);
  }

  off(event: WSEvent | string, handler: MessageHandler) {
    if (!this.handlers[event]) return;
    this.handlers[event] = this.handlers[event].filter(h => h !== handler);
  }

  private emit(event: string, data: any) {
    this.handlers[event]?.forEach(h => h(data));
  }

  private sendRaw(message: object) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('[WS] Attempted to send while socket not open');
      return;
    }
    this.socket.send(JSON.stringify(message));
  }
}

export const wsClient = new WSClient();