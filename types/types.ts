import type { Request } from "express"

export interface userRequest extends Request {
    email?: string
} 
export interface AuthPayload extends Request {
    email?: string
} 

