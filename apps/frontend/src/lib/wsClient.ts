import { useAuthStore } from './store';

type MessageHandler = (data: any) => void;
interface SpaceJoinedPayload {
  spawn: { x: number; y: number };
  users: { id: string; x: number; y: number }[];
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
  private messageBuffer: { event: string; data: any }[] = [];       // This buffer will store all the messages that are received before the socket is connected

  // WS Connection

  connect(url: string, spaceId: string) {
    console.log(`[WS] Connecting to ${url} (spaceId=${spaceId})...`);

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
      console.log('[WS] Raw message received:', event.data);
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
      this.messageBuffer = [];
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
    this.handlers = {};
    this.messageBuffer = [];
  }

  // Message router: translates schema types -> internal events 

  private handleMessage(message: { type: string; payload: any }) {
    const { type, payload } = message;
    console.log('[WS] Parsed message received', { type, payload });

    switch (type) {
      case 'space-joined': {
        const data = payload as SpaceJoinedPayload;
        console.log('[WS] space-joined', data);
        this.emitOrBuffer('space-joined', data);
        break;
      }

      case 'user-join': {
        const data = payload as UserJoinPayload;
        console.log('[WS] user-join', data);
        this.emitOrBuffer('user-join', data);
        break;
      }

      case 'user-left': {
        const data = payload as UserLeftPayload;
        console.log('[WS] user-left', data);
        this.emitOrBuffer('user-left', data);
        break;
      }

      case 'movement': {
        const data = payload as MovementPayload;
        this.emitOrBuffer('movement', data);
        break;
      }

      case 'movement-rejected': {
        const data = payload as MovementRejectedPayload;
        console.warn('[WS] movement-rejected: snapping back to', data);
        this.emitOrBuffer('movement-rejected', data);
        break;
      }

      default:
        console.warn('[WS] Unknown message type:', type);
    }
  }

  // If no handlers yet, buffer the message
  private emitOrBuffer(event: string, data: any) {
    if (this.handlers[event]?.length) {
      this.emit(event, data);
    } else {
      console.log(`[WS] Buffering "${event}" : no listeners yet`);
      this.messageBuffer.push({ event, data });
    }
  }

  
  // Client -> server 

  // Called by Phaser's update loop after local player moves
  sendMovement(x: number, y: number) {
    if (!this.connected) return;
    console.log('[WS] Sending movement', { x, y });
    this.sendRaw({ type: 'move', payload: { x, y } });
  }

  // Pub/sub used by Phaser scenes and React components
  on(event: WSEvent | string, handler: MessageHandler) {
    if (!this.handlers[event]) this.handlers[event] = [];
    this.handlers[event].push(handler);

    // When a listener registers, flush any buffered messages for that event
    const pending = this.messageBuffer.filter(m => m.event === event);
    if (pending.length) {
      console.log(`[WS] Flushing ${pending.length} buffered "${event}" message(s)`);
      this.messageBuffer = this.messageBuffer.filter(m => m.event !== event);
      pending.forEach(m => handler(m.data));
    }
  }

  off(event: WSEvent | string, handler: MessageHandler) {
    if (!this.handlers[event]) return;
    this.handlers[event] = this.handlers[event].filter(h => h !== handler);
  }

  public emit(event: string, data: any) {
    this.handlers[event]?.forEach(h => h(data));
  }

  private sendRaw(message: object) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('[WS] Attempted to send while socket not open');
      return;
    }
    console.log('[WS] Sending raw message', message);
    this.socket.send(JSON.stringify(message));
  }
}

export const wsClient = new WSClient();