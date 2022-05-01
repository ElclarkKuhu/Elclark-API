const mongoose = require('mongoose')
const authenticate = require('../components/authenticate')
const File = require('../models/files')

main().catch(err => console.log(err))
async function main() {
    mongoose.connect(process.env.MONGO_URI)
}

module.exports = async (req, res) => {
    if (req.method === 'OPTIONS') {
        return res.status(200).send('ok')
    }

    if (req.method === 'GET') {
        let data = req.body

        if (!data.slug) return res.status(400).send('Bad Request')

        let file = await File.find({ slug: data.slug }).exec()
        if (!file) return res.status(404).send('Not Found')

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