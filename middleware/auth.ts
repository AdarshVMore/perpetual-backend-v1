import jwt from "jsonwebtoken"
import type { NextFunction, Request, Response } from "express"
import type { userRequest, AuthPayload } from "../types/types"

const JWT_SECRET = "secret"

export async function authMiddleware(req:userRequest, res:Response, next:NextFunction) {
    const tokenArray = req?.headers.authorization

    if(!tokenArray){
        res.status(401).json({message: "unAuthorized"})
        return
    }

    const token = tokenArray.split(' ')[1]

    if(!token){
        res.status(401).json({message: "unAuthorized"})
        return
    }

    try{
        const verify = jwt.verify(token, JWT_SECRET ) as AuthPayload

        if(!verify){
            res.status(401).json({message: "unAuthorized"})
        }

        req.email = verify.email

        next()

    }catch(err){}


}