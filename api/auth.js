const jwt = require('jsonwebtoken')
const bcryptjs = require('bcryptjs')
const { MongoClient } = require('mongodb')

const tokenSecret = process.env.TOKEN_SECRET
const expiresIn = 60 * 60 * 24 * 7 // 1 week

const MONGO_URI = process.env.MONGO_URI
const MONGO_DB = process.env.MONGO_DB
const mongo = new MongoClient(MONGO_URI)

module.exports = async (req, res) => {
    // Handle Preflight Requests
    if (req.method === 'OPTIONS') {
        res.status(200).send('ok')
        return
    }

    if (req.method === 'POST') {
        let user
        const body = req.body

        if (!body || !body.username || !body.password) {
            return res.status(400).send('Bad Request')
        }

        try {
            await mongo.connect()
            user = mongo.db(MONGO_DB).collection('users').findOne({ username: body.username })
            if (!user) return res.status(401).send('Unauthorized')
        } catch (err) {
            console.log(err)
            return res.status(500).send('Internal Server Error')
        } finally {
            await mongo.close()
        }

        const valid = await bcryptjs.compare(body.password, user.password)
        if (!valid) {
            return res.status(401).send('Unauthorized')
        }

        const token = jwt.sign({ id: user._id }, tokenSecret, { expiresIn })
        return res.status(200).json({ token, expiresIn })
    }

    res.status(405).send('Method Not Allowed')
}