import { WebSocket } from "ws";
import { OutgoingMessage } from "./types";
import { prisma } from "@pixelley/db";
import { RoomManager } from "./RoomManager";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

function generateId(length = 10) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";

    for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
}

export class User {
    public id: string;
    private spaceId?: string;
    public dbUserId: string = '';
    public name: string = '';
    public avatarIdleUrl: string = '';
    private x: number;
    private y: number;
    private ws: WebSocket;
    private worldMapWidth: number = 1500;
    private worldMapHeight: number = 1000;

    constructor(ws: WebSocket) {
        this.id = generateId(10),
        this.ws = ws;
        this.x = 0;
        this.y = 0;
        this.worldMapWidth = 1500;
        this.worldMapHeight = 1000;
        this.initHandlers();
    }

    initHandlers() {
        this.ws.on("message", async (data) => {
            const parsedData = JSON.parse(data.toString());

            switch (parsedData.type) {
                case "join": 
                    this.spaceId = parsedData.payload.spaceId;

                    const token = parsedData.payload.token
                    
                    const userId = await (jwt.verify(token, process.env.JWT_PASSWORD as string) as JwtPayload).userId

                    if(!userId) {
                        this.ws.close();
                        return;
                    }

                    const dbUser = await prisma.user.findUnique({
                        where: { id: userId },
                        include: { avatar: true }
                    });

                    if(!dbUser) { 
                        this.ws.close(); return;
                    }

                    this.dbUserId       = dbUser.id;
                    this.name           = dbUser.name;
                    this.avatarIdleUrl  = dbUser.avatar?.idleUrl ?? '';

                    const space = await prisma.space.findUnique({
                        where: {
                            id: this.spaceId
                        }
                    });

                    if(!space || !this.spaceId) {
                        this.ws.close();
                        return;
                    }

                    RoomManager.getInstance().addUser(this.spaceId, this);
                    this.x = Math.floor(Math.random() * space.width);
                    this.y = Math.floor(Math.random() * space.height);

                    this.send({
                        type: "space-joined",
                        payload: {
                            spawn: {
                                x: this.x,
                                y: this.y
                            },
                            users: RoomManager.getInstance().rooms.get(this.spaceId)?.filter(x => x.id !== this.id).map(u => ({
                                id: u.id,
                                x: u.x,
                                y: u.y, 
                                name: u.name, 
                                avatarIdleUrl: u.avatarIdleUrl
                            })) ?? []
                        }
                    })

                    RoomManager.getInstance().broadcast({
                        type: "user-join",
                        payload: {
                            userId: this.id,
                            x: this.x,
                            y: this.y, 
                            name: this.name, 
                            avatarIdleUrl: this.avatarIdleUrl
                        }
                    }, this.spaceId, this)

                    break;

                case "move": 
                    const moveX = parsedData.payload.x;
                    const moveY = parsedData.payload.y;
                    
                    const xDisplacement = Math.abs(this.x - moveX);
                    const yDisplacement = Math.abs(this.y - moveY);

                    const MAX_MOVE_DISTANCE = 160;
                    const withinDistance = xDisplacement <= MAX_MOVE_DISTANCE && yDisplacement <= MAX_MOVE_DISTANCE;
                    const withinBounds = moveX >= 0 && moveY >= 0 && moveX <= this.worldMapWidth && moveY <= this.worldMapHeight;

                    if(withinDistance && withinBounds) {
                        this.x = moveX;
                        this.y = moveY;

                        RoomManager.getInstance().broadcast({
                            type: "movement", 
                            payload: {
                                x: this.x,
                                y: this.y,
                                userId: this.id
                            }
                        }, this.spaceId!, this)

                        return
                    }

                    this.send({
                        type: "movement-rejected",
                        payload: {
                            x: this.x,
                            y: this.y
                        }
                    })

                    break;

                    case "chat":
                        const chatMessage = parsedData.payload.message as string;
                        if (!chatMessage || !chatMessage.trim() || !this.spaceId) break;
    
                        // Broadcast to all users in the space (including sender so they see their own message)
                        RoomManager.getInstance().broadcastAll({
                            type: "chat",
                            payload: {
                                userId: this.dbUserId,
                                username: this.name,
                                message: chatMessage.trim().slice(0, 200),
                                timestamp: Date.now()
                            }
                        }, this.spaceId!)
    
                        break;
            }
        })
    }

    destroy() {
        RoomManager.getInstance().broadcast({
            type: "user-left",
            payload: {
                userId: this.id
            }
        }, this.spaceId!, this)

        RoomManager.getInstance().removeUser(this.spaceId!, this)
    }

    send(message: OutgoingMessage) {
        this.ws.send(JSON.stringify(message));
    }
}