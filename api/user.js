import MongoDB from '../components/database.js'

export default async (req, res) => {
    if (req.method === 'OPTIONS') {
        return res.status(200).send('ok')
    }

    if (req.method === 'POST') {
        const data = req.body

        if (!data) return res.status(400).send('Bad Request')
        if (!data.username) {
            if (!data.id) {
                return res.status(400).send('Bad Request')
            }
        }

        let _id
        if (data.id) {
            _id = {
                "$oid": data.id,
            }
        }

        const user = await MongoDB('findOne', 'users', {
            filter: {
                _id,
                username: data.username || undefined,
            }
        })
        
        if (!user.document) return res.status(404).send('Not Found')
        
        return res.status(200).json({
            id: user.document._id,
            username: user.document.username,
            avatar: user.document.avatar,
            bio: user.document.bio,
            email: user.document.email,
            firstName: user.document.firstName,
            lastName: user.document.lastName,
            role: user.document.role,
            createdAt: user.document.createdAt,
        })
    }

    res.status(405).send('Method Not Allowed')
}