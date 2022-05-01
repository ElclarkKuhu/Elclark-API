const mongoose = require('mongoose')

const { Schema } = mongoose
const userSchema = new Schema({
    username: String,
    password: String,
    email: String,
    firstName: String,
    lastName: String,
    avatar: String,
    role: String,
    bio: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
})

const User = mongoose.model('User', userSchema)
module.exports = User