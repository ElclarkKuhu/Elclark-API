import MongoDB from '../components/database.js'
import { S3Client, Bucket } from '../components/s3.js'
import authenticate from '../components/authenticate.js'

export default async (req, res) => {
    if (req.method === 'OPTIONS') {
        return res.status(200).send('ok')
    }

    const auth = authenticate(req.headers.authorization)
    if (!auth) return res.status(401).send('Unauthorized')
    const { id } = auth

    if (req.method === 'GET') {
        const { documents } = await MongoDB('find', 'files', { sort: { date: -1 } })
        return res.status(200).json(documents)
    }

    if (req.method === 'POST') {
        const data = req.body
        if (!data || !data.name || !data.slug || !data.size || !data.type || !data.visibility) {
            return res.status(400).send('Bad Request')
        }

        const { name, slug, size, type, visibility } = data

        const exists = await MongoDB('findOne', 'files', { filter: { slug } })
        if (exists.document) {
            return res.status(409).send('Conflict')
        }

        const Key = `${id}/${slug}/${name}`
        const signedUrl = S3Client.getSignedUrl('putObject', {
            Bucket,
            Key,
        })

        const document = {
            owner: id,
            key: Key,
            name,
            slug,
            size,
            type,
            visibility,
            uploaded: false,
            date: new Date()
        }

        const insert = await MongoDB('insertOne', 'files', { document })
        if (!insert) {
            return res.status(500).send('Internal Server Error')
        }

        return res.status(200).json({
            name: name,
            url: signedUrl,
            key: Key,
        })
    }

    if (req.method === 'PATCH') {
        const data = req.body
        if (!data || !data.slug) {
            return res.status(400).send('Bad Request')
        }

        const { slug } = data
        const exists = await MongoDB('findOne', 'files', { filter: { slug } })
        if (!exists.document) {
            return res.status(404).send('Not Found')
        }

        // TODO: FIX RENAME (POSSIBLY STORJ SIDE ISSUE)
        // if (data.name) {
        //     const file = await File.findOne({ slug: slug }).exec()

        //     console.log(Bucket)

        //     // rename the file on S3
        //     const Key = `${id}/${slug}/${data.name}`
        //     await S3Client.copyObject({
        //         Bucket,
        //         CopySource: file.key,
        //         Key,
        //     }).promise()

        //     console.log(Bucket)

        //     // delete the old file on S3
        //     await S3Client.deleteObject({
        //         Bucket,
        //         Key: file.key,
        //     }).promise()

        //     console.log(Bucket)

        //     // update the file in the database
        //     file.name = data.name
        //     file.key = Key
        //     await file.save()
        // }

        if (data.visibility) {
            MongoDB('updateOne', 'files', { filter: { slug }, update: { $set: { visibility: data.visibility } } })
        }

        if (data.uploaded) {
            MongoDB('updateOne', 'files', { filter: { slug }, update: { $set: { uploaded: data.uploaded } } })
        }

        if (data.owner) {
            MongoDB('updateOne', 'files', { filter: { slug }, update: { $set: { owner: data.owner } } })
        }

        return res.status(200).send('OK')
    }

    if (req.method === 'DELETE') {
        // TODO: Delete file
    }

    res.status(405).send('Method Not Allowed')
}