import MongoDB from '../components/database.js'
import authenticate from '../components/authenticate.js'



export default async (req, res) => {
    const auth = authenticate(req.headers.authorization)

    if (req.method === 'OPTIONS') {
        return res.status(200).send('ok')
    }

    if (req.method === 'GET') {
        let data = req.body

        if (!data || !data.slug) return res.status(400).send('Bad Request')

        const { slug } = data
        const file = await MongoDB('findOne', 'files', { filter: { slug } })

        if (file.visibility === 'private') {
            if (!auth) return res.status(401).send('Unauthorized')
            if (auth.id !== file.owner) return res.status(401).send('Unauthorized')
        }

        return res.status(200).json(file)
    }

    res.status(405).send('Method Not Allowed')
}