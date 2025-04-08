import express from 'express';
import bcryptjs from "bcryptjs";
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import AdminSchema from '../schemas/adminSchema.js';

dotenv.config();
const router = express.Router();

router.post('/', async (req, res) => {
    const { username, password } = req.body;

    try {
        const existingAdmin = await AdminSchema.findOne({ username });
        if (existingAdmin) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcryptjs.hash(password, 10);
        const newAdmin = new AdminSchema({ username, password: hashedPassword });
        await newAdmin.save();

        const token = jwt.sign({ id: newAdmin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        return res.status(201).json({
            message: 'Admin registered successfully',
            token,
            data: {
                id: newAdmin._id,
                username: newAdmin.username,
            },
        });
        
    } catch (err) {
        res.status(500).json({ error: 'Error during registration' });
    }
});

export default router;
