import zod from "zod";

export const SignupSchema = zod.object({
    username: zod.string().email(),
    password: zod.string().min(8, "Password too short").regex(/^\S+$/, "No spaces allowed"),
    name: zod.string().trim().min(1).max(20),
    gender: zod.string()
})

export const SigninSchema = zod.object({
    username: zod.email(), 
    password: zod.string().min(8, "Password too short").regex(/^\S+$/, "No spaces allowed"),
})

// ------------ TODO: Add avatar selection
// export const UpdateMetadataSchema = zod.object({
//     avatarId: zod.string()
// })
  
export const AddElementSchema = zod.object({
    elementId: zod.string(), 
    spaceId: zod.string(), 
    x: zod.number(),               // maybe check if it is within dimensions of the created space
    y: zod.number()
})

export const DeleteElementSchema = zod.object({
    id: zod.string(), 
})

// Extending the req obj globally to include uesrID, role and username
declare global {
  namespace Express {
    export interface Request {
      userId?: string;
      username?: string;
      gender: string;
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