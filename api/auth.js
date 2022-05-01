const jwt = require('jsonwebtoken')
const bcryptjs = require('bcryptjs')
const mongoose = require('mongoose')
const User = require('./models/users')

const tokenSecret = process.env.TOKEN_SECRET
const expiresIn = 60 * 60 * 24 * 7 // 1 week

main().catch(err => console.log(err))
async function main() {
    mongoose.connect(process.env.MONGO_URI)
}

module.exports = async (req, res) => {
    // Handle Preflight Requests
    if (req.method === 'OPTIONS') {
        res.status(200).send('ok')
        return
    }

    if (req.method === 'POST') {
        const body = req.body

        if (!body.username || !body.password) {
            return res.status(400).send('Bad Request')
        }

        const user = await User.findOne({ username: body.username }).exec()
        if (!user) {
            return res.status(404).send('Not Found')
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