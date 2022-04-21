import dotenv from 'dotenv'
dotenv.config()

import jwt from 'jsonwebtoken'

const tokenSecret = process.env.TOKEN_SECRET

function getUserId(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (token == null) {
        req.locals = {}
        next()
        return
    }

    jwt.verify(token, tokenSecret, (err, decoded) => {
        if (err) {
            res.sendStatus(403)
            return
        } 

        req.locals = {
            _id: decoded.id
        }
    })

    next()
}

export default getUserId