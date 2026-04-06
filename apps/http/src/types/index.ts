import { Role } from "@pixelley/db/prisma";
import zod from "zod";

export const SignupSchema = zod.object({
    username: zod.email(),
    password: zod.string().min(10),
    role: zod.enum(["Admin", "User"])
})

export const SigninSchema = zod.object({
    username: zod.email(), 
    password: zod.string().min(10)
})

export const UpdateMetadataSchema = zod.object({
    avatarId: zod.string()
})

export const CreateSpaceSchema = zod.object({
    name: zod.string(),
    dimensions: zod.string().regex(/^[0-9]{1-4}x[0-9]{1-4}$/),
    mapId: zod.string(),
})

export const AddElementSchema = zod.object({
    elementId: zod.string(), 
    spaceId: zod.string(), 
    x: zod.number(),               // maybe check if it is within dimensions of the created space
    y: zod.number()
})

export const CreateElementSchema = zod.object({
    imageUrl: zod.httpUrl(), 
    width: zod.number(), 
    height: zod.number(), 
    static: zod.boolean()
})

export const UpdateElementSchema = zod.object({
    imageUrl: zod.httpUrl()
})

export const DeleteElementSchema = zod.object({
    id: zod.string(), 
})

export const CreateAvatarSchema = zod.object({
    imageUrl: zod.httpUrl(), 
    name: zod.string()
})

export const CreateMap = zod.object({
    thumbnail: zod.httpUrl(), 
    dimensions: zod.string().regex(/^[0-9]{1-4}x[0-9]{1-4}$/),
    name: zod.string(), 
    defaultElements: zod.array(
        zod.object({
            elementId: zod.string(), 
            x: zod.number(),
            y: zod.number()
        })
    )
})

// Extending the req obj globally to include uesrID, role and username
declare global {
  namespace Express {
    export interface Request {
      userId?: string;
      username?: string;
      role?: Role;
    }
  }
}

export const BulkMetadataSchema = zod.string()                                       // ids of type string
    .transform(                                             // are transformed to an array to strings by splitting at ","
        (val) => val.split(",")
    )
    .pipe(zod.array(zod.string()))              // the generated output is passed through pipe to check if it is really an array of numbers

// This type is to ensure that the path params are always string and not string[] or undefined
export type Params = {
    spaceId: string;
};