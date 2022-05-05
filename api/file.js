import MongoDB from '../components/database.js'
import authenticate from '../components/authenticate.js'

export default async (req, res) => {
    if (req.method === 'OPTIONS') {
        return res.status(200).send('ok')
    }

    if (req.method === 'POST') {
        let data = req.body
        if (!data || !data.slug) return res.status(400).send('Bad Request')

        const { slug } = data
        const file = await MongoDB('findOne', 'files', { filter: { slug } })
        if (!file.document) return res.status(404).send('Not Found')

        if (file.document.visibility === 'private') {
            const auth = authenticate(req.headers.authorization)

            if (!auth) return res.status(401).send('Unauthorized')
            if (auth.id !== file.document.owner) return res.status(401).send('Unauthorized')
        }

        return res.status(200).json(file.document)
    }

    res.status(405).send('Method Not Allowed')
}