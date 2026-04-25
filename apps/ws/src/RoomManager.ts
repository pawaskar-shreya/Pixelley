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
            this.rooms.set(spaceId, [user])
        }
        this.rooms.set(spaceId, [...(this.rooms.get(spaceId) ?? []), user]);
    }

    public removeUser(spaceId: string, user: User) {
        if(!this.rooms.has(spaceId)) {
            return
        }
        this.rooms.get(spaceId)?.filter((u) => {
            u.id !== user.id
        })
    }

    public broadcast(message: OutgoingMessage, spaceId: string, user: User) {
        if(!this.rooms.has(spaceId)) {
            return
        }
        this.rooms.get(spaceId)?.forEach((u) => {
            if(u.id !== user.id) {
                u.send(message)
            }
        })
    }
}