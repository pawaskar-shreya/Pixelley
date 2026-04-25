import { PlayerState } from './types';

type MessageHandler = (data: any) => void;

class WSClient {
  private handlers: Record<string, MessageHandler[]> = {};
  private connected = false;

  connect(url: string) {
    console.log(`[WS] Connecting to ${url}...`);
    // Mock connection
    setTimeout(() => {
      this.connected = true;
      this.emit('connect', {});
      
      // Mock remote player joining after 2 seconds
      setTimeout(() => {
        this.emit('playerJoined', { id: 'remote-1', x: 200, y: 200, vx: 0, vy: 0 });
      }, 2000);
    }, 500);
  }

  disconnect() {
    this.connected = false;
    this.emit('disconnect', {});
  }

  on(event: string, handler: MessageHandler) {
    if (!this.handlers[event]) this.handlers[event] = [];
    this.handlers[event].push(handler);
  }

  off(event: string, handler: MessageHandler) {
    if (!this.handlers[event]) return;
    this.handlers[event] = this.handlers[event].filter(h => h !== handler);
  }

  emit(event: string, data: any) {
    if (this.handlers[event]) {
      this.handlers[event].forEach(h => h(data));
    }
  }

  sendMovement(state: Partial<PlayerState>) {
    if (!this.connected) return;
    // console.log('[WS] Sending movement', state);
    // In a real app, send via WebSocket
  }

  // Add emit method for sending custom events to server
  sendEvent(event: string, data: any) {
    if (!this.connected) return;
    console.log(`[WS] Sending event ${event}`, data);
  }
}

export const wsClient = new WSClient();
