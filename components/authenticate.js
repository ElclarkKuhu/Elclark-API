import jwt from 'jsonwebtoken'

const tokenSecret = process.env.TOKEN_SECRET

export default function authenticate(token) {
    if (!token) return
    token = token.split(' ')[1]
    if (token == null) return

    let decoded
    try {
        decoded = jwt.verify(token, tokenSecret)
    } catch (err) {
        return
    }

    return decoded
}