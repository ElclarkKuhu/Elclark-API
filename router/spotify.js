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

router.get('/token/', async (req, res) => {
    return await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            Authorization: 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64')),
            'content-type': 'application/x-www-form-urlencoded',
            accept: 'application/json',
        },
        body: `refresh_token=${refresh_token}&grant_type=refresh_token&redirect_uri=${redirect_uri}`
    }).then((response) => response.json()).then((data) => {
        return {
            body: data
        }
    })
})

export default router