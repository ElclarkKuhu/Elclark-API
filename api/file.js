const { MongoClient } = require('mongodb')
const authenticate = require('../components/authenticate')

const MONGO_URI = process.env.MONGO_URI
const MONGO_DB = process.env.MONGO_DB
const mongo = new MongoClient(MONGO_URI)

module.exports = async (req, res) => {
    if (req.method === 'OPTIONS') {
        return res.status(200).send('ok')
    }

    if (req.method === 'GET') {
        let file
        let data = req.body

        if (!data || !data.slug) return res.status(400).send('Bad Request')

        try {
            await mongo.connect()
            file = await mongo.db(MONGO_DB).collection('files').find({ slug: data.slug })
            if (!file) return res.status(404).send('Not Found')
        } catch (err) {
            console.log(err)
            return res.status(500).send('Internal Server Error')
        } finally {
            await mongo.close()
        }

        if (file.visibility === 'private') {
            if (!data.token) return res.status(401).send('Unauthorized')

            const auth = authenticate(data.token)
            if (!auth) return res.status(401).send('Unauthorized')

            if (auth.id !== file.owner) return res.status(401).send('Unauthorized')
        }

        return res.status(200).json(file)
    }

    res.status(405).send('Method Not Allowed')
}