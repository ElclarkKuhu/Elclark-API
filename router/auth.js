import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import bcryptjs from 'bcryptjs'

import User from '../models/users.js'
const tokenSecret = process.env.TOKEN_SECRET
const expiresIn = 86400

main().catch(err => console.log(err))
async function main() {
    mongoose.connect(process.env.MONGO_URI)
}

const router = express.Router()
router.use(express.json())

router.post("/login/", (req, res) => {
    let data = req.body

    if (!data.username || !data.password) {
        return res.status(400).send({
            message: "Username and password are required!"
        })
    }

    User.findOne({
        username: data.username
    }, (err, user) => {
        if (err) {
            res.sendStatus(500)
            return
        }

        if (!user) {
            res.sendStatus(404)
            return
        }

        const passwordIsValid = bcryptjs.compareSync(data.password, user.password)
        if (!passwordIsValid) {
            res.sendStatus(401)
            return
        }

        const token = jwt.sign({
            id: user._id
        }, tokenSecret, {
            expiresIn
        })

        res.status(200).send({
            auth: true,
            expiresIn,
            token: token
        })
    })
})

export default router