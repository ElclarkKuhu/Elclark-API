import fetch from 'node-fetch'

const client_id = process.env.SPOTIFY_CLIENT_ID
const client_secret = process.env.SPOTIFY_CLIENT_SECRET
const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN
const redirect_uri = process.env.SPOTIFY_REDIRECT_URI

export default async (req, res) => {
    if (req.method === 'OPTIONS') {
        return res.status(200).send('ok')
    }

    if (req.method === 'GET') {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                Authorization: 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64')),
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `refresh_token=${refresh_token}&grant_type=refresh_token&redirect_uri=${redirect_uri}`
        })
        
        if (response.status !== 200) {
            return res.status(500).send('Internal Server Error')
        }

        const json = await response.json()
        return res.status(200).json(json)
    }

    res.status(405).send('Method Not Allowed')
}