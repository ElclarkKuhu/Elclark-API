const { MongoClient } = require('mongodb')
const S3 = require('aws-sdk/clients/s3')
const authenticate = require('../components/authenticate')

const MONGO_URI = process.env.MONGO_URI
const MONGO_DB = process.env.MONGO_DB

const accessKeyId = process.env.S3_KEY
const secretAccessKey = process.env.S3_SECRET
const endpoint = process.env.S3_ENDPOINT
const region = process.env.S3_REGION
const Bucket = process.env.S3_BUCKET

const mongo = new MongoClient(MONGO_URI)
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
        let files

        try {
            await mongo.connect()
            files = mongo.db(MONGO_DB).collection('files').find({}, {
                sort: {
                    date: -1
                }
            })
        } catch (err) {
            console.log(err)
            return res.status(500).send('Internal Server Error')
        } finally {
            await mongo.close()
        }

        return res.status(200).json(files)
    }

    if (req.method === 'POST') {
        const body = req.body
        if (!body || !body.name || !body.slug || !body.size || !body.type || !body.visibility) {
            res.status(400).send('Bad Request')
            return
        }

        const { name, slug, size, type, visibility } = body

        try {
            await mongo.connect()
            const exists = await mongo.db(MONGO_DB).collection('files').findOne({ slug: slug })

            if (exists) {
                await mongo.close()
                return res.status(409).send('Conflict')
            }
        } catch (err) {
            console.log(err)
            return res.status(500).send('Internal Server Error')
        }

        const Key = `${id}/${slug}/${name}`
        const signedUrl = client.getSignedUrl('putObject', {
            Bucket,
            Key,
        })

        try {
            await mongo.db(MONGO_DB).collection('files').insertOne({
                owner: id,
                key: Key,
                name,
                slug,
                size,
                type,
                visibility,
                uploaded: false,
                date: new Date()
            })
        } catch (err) {
            console.log(err)
            return res.status(500).send('Internal Server Error')
        } finally {
            await mongo.close()
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
        try {
            await mongo.connect()
            const exists = await mongo.db(MONGO_DB).collection('files').findOne({ slug: slug })

            if (!exists) {
                await mongo.close()
                return res.status(404).send('Not Found')
            }
        } catch (err) {
            console.log(err)
            return res.status(500).send('Internal Server Error')
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
            try {
                await mongo.db(MONGO_DB).collection('files').updateOne({ slug: slug }, {
                    $set: {
                        visibility: body.visibility
                    }
                })
            } catch (error) {
                console.log(error)
                return res.status(500).send('Internal Server Error')
            }
        }

        if (body.uploaded) {
            try {
                await mongo.db(MONGO_DB).collection('files').updateOne({ slug: slug }, {
                    $set: {
                        uploaded: body.uploaded
                    }
                })
            } catch (error) {
                console.log(error)
                return res.status(500).send('Internal Server Error')
            }
        }

        if (body.owner) {
            try {
                await mongo.db(MONGO_DB).collection('files').updateOne({ slug: slug }, {
                    $set: {
                        owner: body.owner
                    }
                })
            } catch (error) {
                console.log(error)
                return res.status(500).send('Internal Server Error')
            }
        }

        try {
            await mongo.close()
        } catch (err) {
            console.log(err)
            return res.status(500).send('Internal Server Error')
        }

        return res.status(200).send('OK')
    }

    if (req.method === 'DELETE') {
        // TODO: Delete file
    }

    res.status(405).send('Method Not Allowed')
}