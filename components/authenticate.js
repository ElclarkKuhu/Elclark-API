import dotenv from 'dotenv'
dotenv.config()

import jwt from 'jsonwebtoken'

const tokenSecret = process.env.TOKEN_SECRET

function authenticate(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (token == null) return res.sendStatus(401)

    jwt.verify(token, tokenSecret, (err, decoded) => {
        if (err) return res.sendStatus(403)

        req.locals = {
            _id: decoded.id
        }

        next()
    })
}

export default authenticate