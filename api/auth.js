import jwt from 'jsonwebtoken'
import bcryptjs from 'bcryptjs'
import MongoDB from '../components/database.js'

const tokenSecret = process.env.TOKEN_SECRET
const expiresIn = 60 * 60 * 24 * 7 // 1 week

export default async (req, res) => {
    if (req.method === 'OPTIONS') {
        return res.status(200).send('ok')
    }

    if (req.method === 'POST') {
        const data = req.body

        if (!data || !data.username || !data.password) {
            return res.status(400).send('Bad Request')
        }

        const response = await MongoDB('findOne', 'users', { filter: { username: data.username } })
        if (!response.document) return res.status(401).send('Unauthorized')
        const user = response.document

        const valid = await bcryptjs.compare(data.password, user.password)
        if (!valid) {
            return res.status(401).send('Unauthorized')
        }

        const token = jwt.sign({ id: user._id }, tokenSecret, { expiresIn })
        return res.status(200).json({ token, expiresIn })
    }

    res.status(405).send('Method Not Allowed')
}