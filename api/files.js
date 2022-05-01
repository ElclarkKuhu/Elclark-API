const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const S3 = require('aws-sdk/clients/s3')
const File = require('./models/files')
const authenticate = require('.common/authenticate')

const accessKeyId = process.env.S3_KEY
const secretAccessKey = process.env.S3_SECRET
const endpoint = process.env.S3_ENDPOINT
const region = process.env.S3_REGION
const Bucket = process.env.S3_BUCKET

main().catch(err => console.log(err))
async function main() {
    mongoose.connect(process.env.MONGO_URI)
}

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

module.exports = async (req, res) => {
    // Handle Preflight Requests
    if (req.method === 'OPTIONS') {
        return res.status(200).send('ok')
    }

    const auth = authenticate(req.headers.authorization)
    if (!auth) return res.status(401).send('Unauthorized')
    const { id } = auth

    if (req.method === 'GET') {
        const data = await File.find({}).sort('-date').exec()
        return res.status(200).json(data)
    }

    if (req.method === 'POST') {
        const body = req.body
        if (!body || !body.name || !body.slug || !body.size || !body.type || !body.visibility) {
            res.status(400).send('Bad Request')
            return
        }

        const { name, slug, size, type, visibility } = body
        const exists = await File.exists({ slug: slug }).exec()
        if (exists) {
            res.status(409).send('Conflict')
            return
        }

        const Key = `${id}/${slug}/${name}`
        const signedUrl = client.getSignedUrl('putObject', {
            Bucket,
            Key,
        })

        let file = new File({
            owner: id,
            key: Key,
            name,
            size,
            visibility,
            slug,
            type,
            uploaded: false,
        })
        file = await file.save()

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
        const exists = await File.exists({ slug: slug }).exec()
        if (!exists) {
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
            await File.updateOne({ slug: slug }, { visibility: body.visibility }).exec()
        }

        if (body.uploaded) {
            await File.updateOne({ slug: slug }, { uploaded: body.uploaded }).exec()
        }

        if (body.owner) {
            await File.updateOne({ slug: slug }, { owner: body.owner }).exec()
        }

        return res.status(200).send('OK')
    }

    if (req.method === 'DELETE') {
        // TODO: Delete file
    }

    res.status(405).send('Method Not Allowed')
}