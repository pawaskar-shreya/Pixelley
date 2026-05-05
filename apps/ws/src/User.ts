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
    private x: number;
    private y: number;
    private ws: WebSocket;
    private spaceWidth: number;
    private spaceHeight: number;

    constructor(ws: WebSocket) {
        this.id = generateId(10),
        this.ws = ws;
        this.x = 0;
        this.y = 0;
        this.spaceWidth = 0;
        this.spaceHeight = 0;
        this.initHandlers();
    }

    initHandlers() {
        this.ws.on("message", async (data) => {
            const parsedData = JSON.parse(data.toString());

            switch (parsedData.type) {
                case "join": 
                    this.spaceId = parsedData.payload.spaceId;

                    const token = parsedData.payload.token
                    console.log("----------------- JWT TOKOEN: " + token);
                    
                    const userId = await (jwt.verify(token, process.env.JWT_PASSWORD as string) as JwtPayload).userId
                    console.log("----------------- USER ID: " + userId);

                    if(!userId) {
                        this.ws.close();
                        return;
                    }

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
                    this.spaceWidth = space.width;
                    this.spaceHeight = space.height;
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
                                y: u.y
                            })) ?? []
                        }
                    })

                    RoomManager.getInstance().broadcast({
                        type: "user-join",
                        payload: {
                            userId: this.id,
                            x: this.x,
                            y: this.y
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
                    const withinBounds = moveX >= 0 && moveY >= 0 && moveX <= this.spaceWidth && moveY <= this.spaceHeight;

                    // Todo: Don't let them get on top of static elements 
                    // Maybe they can pass past each other
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