const jwt = require('jsonwebtoken')
const bcryptjs = require('bcryptjs')
const mongoose = require('mongoose')

const tokenSecret = process.env.TOKEN_SECRET
const expiresIn = 60 * 60 * 24 * 7 // 1 week

const { Schema } = mongoose
const userSchema = new Schema({
    username: String,
    password: String,
    email: String,
    firstName: String,
    lastName: String,
    avatar: String,
    role: String,
    bio: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
})

const User = mongoose.model('User', userSchema)

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
        res.status(200).json({ token, expiresIn })
    }

    res.status(405).send()
}