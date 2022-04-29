const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const S3 = require('aws-sdk/clients/s3')

const tokenSecret = process.env.TOKEN_SECRET
const accessKeyId = process.env.S3_KEY
const secretAccessKey = process.env.S3_SECRET
const endpoint = process.env.S3_ENDPOINT
const region = process.env.S3_REGION
const Bucket = process.env.S3_BUCKET

const { Schema } = mongoose
const fileSchema = new Schema({
    key: String,
    name: String,
    owner: String,
    size: Number,
    slug: String,
    type: String,
    uploaded: Boolean,
    visibility: String,
    date: { type: Date, default: Date.now },
})
const File = mongoose.model('File', fileSchema)

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
    const { id } = authenticate(req.headers.authorization)
    if (!id) return res.status(401).send('Unauthorized')

    if (req.method === 'GET') {
        const data = await File.find({}).sort('-date').exec()
        res.status(200).json(data)

        return
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

        res.status(200).json({
            name: name,
            url: signedUrl,
            key: Key,
        })

        return
    }

    if (req.method === 'DELETE') {
        // TODO: Delete file
    }

    res.status(405).send()
}

function authenticate(token) {
    if (!token) return
    token = token.split(' ')[1]
    if (token == null) return

    let decoded
    try {
        decoded = jwt.verify(token, tokenSecret)
    } catch (err) {
        return
    }

    return decoded
}