import dotenv from 'dotenv'
dotenv.config()

import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'
import bcryptjs from 'bcryptjs'

import auth from './router/auth.js'
import file from './router/file.js'
import user from './router/user.js'

const app = express()
app.use(cors())
app.use(express.json())
app.use('/auth', auth)
app.use('/user', user)
app.use('/file', file)

// app.get('/', (req, res) => {

// })

app.listen(3200, () => {
});