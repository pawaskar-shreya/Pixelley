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

    constructor(ws: WebSocket) {
        this.id = generateId(10),
        this.ws = ws;
        this.x = 0;
        this.y = 0;
        this.initHandlers();
    }

    initHandlers () {
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
                            users: RoomManager.getInstance().rooms.get(this.spaceId)?.filter(x => x.id !== this.id).map(u => ({id: u.id})) ?? []
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
                    const moveY = parsedData.payload.moveY;
                    
                    const xDisplacement = Math.abs(this.x - moveX);
                    const yDisplacement = Math.abs(this.y - moveY);

                    // Todo: Don't let them get on top of static elements and outside the wall
                    // Maybe they can pass past each other
                    if((xDisplacement == 1 && yDisplacement == 0) || (yDisplacement == 1 && xDisplacement == 0)) {
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