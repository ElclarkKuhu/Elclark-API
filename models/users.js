import mongoose from 'mongoose'
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
    createdAt: Date,
    updatedAt: Date
})

const User = mongoose.model('User', userSchema)

export default User