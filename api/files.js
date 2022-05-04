import S3 from 'aws-sdk/clients/s3.js'
import MongoDB from '../components/database.js'
import authenticate from '../components/authenticate.js'

const accessKeyId = process.env.S3_KEY
const secretAccessKey = process.env.S3_SECRET
const endpoint = process.env.S3_ENDPOINT
const region = process.env.S3_REGION
const Bucket = process.env.S3_BUCKET

const client = new S3({
    region,
    accessKeyId,
    secretAccessKey,
    endpoint,
    s3ForcePathStyle: true,
    signatureVersion: "v4",
    connectTimeout: 0,
    httpOptions: { timeout: 0 }
})

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
        const body = req.body
        if (!body || !body.name || !body.slug || !body.size || !body.type || !body.visibility) {
            return res.status(400).send('Bad Request')
        }

        const { name, slug, size, type, visibility } = body

        const exists = await MongoDB('findOne', 'files', { filter: { slug } })
        if (exists.document) {
            return res.status(409).send('Conflict')
        }

        const Key = `${id}/${slug}/${name}`
        const signedUrl = client.getSignedUrl('putObject', {
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
        const body = req.body
        if (!body || !body.slug) {
            return res.status(400).send('Bad Request')
        }

        const { slug } = body
        const exists = await MongoDB('findOne', 'files', { filter: { slug } })
        if (!exists.document) {
            return res.status(404).send('Not Found')
        }

        // TODO: FIX RENAME (POSSIBLY STORJ SIDE ISSUE)
        // if (body.name) {
        //     const file = await File.findOne({ slug: slug }).exec()

        //     console.log(Bucket)

        //     // rename the file on S3
        //     const Key = `${id}/${slug}/${body.name}`
        //     await client.copyObject({
        //         Bucket,
        //         CopySource: file.key,
        //         Key,
        //     }).promise()

        //     console.log(Bucket)

        //     // delete the old file on S3
        //     await client.deleteObject({
        //         Bucket,
        //         Key: file.key,
        //     }).promise()

        //     console.log(Bucket)

        //     // update the file in the database
        //     file.name = body.name
        //     file.key = Key
        //     await file.save()
        // }

        if (body.visibility) {
            MongoDB('updateOne', 'files', { filter: { slug }, update: { $set: { visibility: body.visibility } } })
        }

        if (body.uploaded) {
            MongoDB('updateOne', 'files', { filter: { slug }, update: { $set: { uploaded: body.uploaded } } })
        }

        if (body.owner) {
            MongoDB('updateOne', 'files', { filter: { slug }, update: { $set: { owner: body.owner } } })
        }

        return res.status(200).send('OK')
    }

    if (req.method === 'DELETE') {
        // TODO: Delete file
    }

    res.status(405).send('Method Not Allowed')
}