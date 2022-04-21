import mongoose from 'mongoose'
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

export default File