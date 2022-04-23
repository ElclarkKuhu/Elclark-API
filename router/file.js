import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import mongoose from 'mongoose'
import S3 from 'aws-sdk/clients/s3.js'

import File from '../models/files.js'

import getUserId from '../components/getUserId.js'
import authenticate from '../components/authenticate.js'

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

const router = express.Router()
router.use(express.json())

router.get('/', authenticate, async (req, res) => {
    const data = await File.find({}).sort('-date').exec()

    if (!data) {
        res.sendStatus(404)
        return
    }

    res.status(200).send(data)
})

router.post('/', authenticate, async (req, res) => {
    let data = req.body
    let uid = req.locals._id

    if (!data.name) {
        res.sendStatus(400)
        return
    }

    const Key = `${uid}/${data.name}`
    const signedUrl = client.getSignedUrl('putObject', {
        Bucket,
        Key,
    })

    let file = new File({
        owner: uid,
        key: Key,
        name: data.name,
        size: data.size,
        visibility: data.visibility,
        slug: data.slug,
        type: data.type,
        uploaded: false,
    })
    file = await file.save()

    res.status(200).send({
        name: data.name,
        url: signedUrl,
    })
})

router.get("/:slug", getUserId, async (req, res) => {
    const slug = req.params.slug

    const data = await File.findOne({ slug }).exec()
    if (!data) {
        res.sendStatus(404)
        return
    }

    if (!data.uploaded) {
        res.sendStatus(404)
        return
    }

    if (data.visibility === 'private' && data.owner !== req.locals._id) {
        res.sendStatus(403)
        return
    }

    res.status(201).send(data)
})

router.get("/:slug/download", getUserId, async (req, res) => {
    const slug = req.params.slug

    const data = await File.findOne({ slug }).exec()
    if (!data) {
        res.sendStatus(404)
        return
    }

    if (!data.uploaded) {
        res.sendStatus(404)
        return
    }

    if (data.visibility === 'private' && data.owner !== req.locals._id) {
        res.sendStatus(403)
        return
    }

    const signedUrl = client.getSignedUrl('getObject', {
        Bucket,
        Key: data.key,
    })

    res.redirect(signedUrl)
})

router.post('/:slug/uploaded', authenticate, async (req, res) => {
    const slug = req.params.slug

    const data = await File.findOne({ slug }).exec()
    if (!data) {
        res.sendStatus(404)
        return
    }

    if (data.uploaded) {
        res.sendStatus(200)
        return
    }

    if (data.owner !== req.locals._id) {
        res.sendStatus(403)
        return
    }

    await File.updateOne({ slug: data.slug }, { uploaded: true }).exec()
    res.sendStatus(200)
})

export default router