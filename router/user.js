import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import mongoose from 'mongoose'

import User from '../models/users.js'
import authenticate from '../components/authenticate.js'

main().catch(err => console.log(err))
async function main() {
    mongoose.connect(process.env.MONGO_URI)
}

const router = express.Router()
router.use(express.json())

router.get('/', authenticate, async (req, res) => {
    const user = await User.findOne({ _id: req.locals._id }).exec()
    if (!user) {
        res.sendStatus(404)
        return
    }

    user.password = undefined
    res.status(200).send(user)
})

router.get("/:user/", async (req, res) => {
    const user = await User.findOne({ username: req.params.user }).exec()

    if (!user) {
        res.sendStatus(404)
        return
    }

    res.status(200).send({
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        bio: user.bio,
    })
})

export default router