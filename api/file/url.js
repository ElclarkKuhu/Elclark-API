import authenticate from '../../components/authenticate.js'
import { S3Client, Bucket } from '../../components/s3.js'

export default async (req, res) => {
    if (req.method === 'OPTIONS') {
        return res.status(200).send('ok')
    }

    if (req.method === 'POST') {
        let data = req.body

        if (!data || !data.key) return res.status(400).send('Bad Request')

        const { key } = data
        const url = S3Client.getSignedUrl('getObject', {
            Bucket,
            Key: key,
        })

        return res.status(200).json({
            url,
            key,
        })
    }

    res.status(405).send('Method Not Allowed')
}