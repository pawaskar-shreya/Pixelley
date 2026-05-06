import { OutgoingMessage } from "./types";
import { User } from "./User";

export class RoomManager {
    rooms: Map<string, User[]> = new Map();
    static instance: RoomManager;

    private constructor() {
        this.rooms = new Map();
    }

    // to make sure RoomManager stays as a singleton class
    static getInstance() {
        if (!this.instance) {
            this.instance = new RoomManager();
        }
        return this.instance;
    }

    public addUser(spaceId: string, user: User) {
        if (!this.rooms.has(spaceId)) {
            this.rooms.set(spaceId, [user]);
            return;
        }
        const users = this.rooms.get(spaceId) ?? [];
        if (users.some((u) => u.id === user.id)) {
            return;
        }
        this.rooms.set(spaceId, [...users, user]);
    }

    public removeUser(spaceId: string, user: User) {
        if(!this.rooms.has(spaceId)) {
            return
        }
        const remaining = (this.rooms.get(spaceId) ?? []).filter((u) => u.id !== user.id);
        if (remaining.length === 0) {
            this.rooms.delete(spaceId);
            return;
        }
        this.rooms.set(spaceId, remaining);
    }

    public broadcast(message: OutgoingMessage, spaceId: string, user: User) {
        if(!this.rooms.has(spaceId)) {
            return
        }

        console.log("[WS Server] Broadcasting message in space", spaceId, "from user", user.id, "message:", message);
        this.rooms.get(spaceId)?.forEach((u) => {
            if(u.id !== user.id) {
                u.send(message)
            }
        })
    }

    public broadcastAll(message: OutgoingMessage, spaceId: string) {
        if(!this.rooms.has(spaceId)) {
            return
        }

        console.log("[WS Server] Broadcasting message to all in space", spaceId, "message:", message);
        this.rooms.get(spaceId)?.forEach((u) => {
            u.send(message)
        })
    }
}