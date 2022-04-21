import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import fetch from 'node-fetch'

const client_id = process.env.SPOTIFY_CLIENT_ID
const client_secret = process.env.SPOTIFY_CLIENT_SECRET
const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN
const redirect_uri = process.env.SPOTIFY_REDIRECT_URI

const router = express.Router()
router.use(express.json())

router.get('/token/', authenticate, async (req, res) => {

})

export default router