import express from 'express';
import bcryptjs from 'bcrypt';
import jwt from 'jsonwebtoken';
import { verifyAdmin } from '../middleware/auth.js';
import dotenv from 'dotenv';
import AdminSchema from '../schemas/adminSchema.js';


const router = express.Router();

router.post('/', async (req, res) => {
  const { username, password } = req.body;
  try {

    console.log("username", username);
    console.log("password", password);


    const admin = await AdminSchema.findOne({ username });
    console.log("admin", admin);

    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    console.log("admin password", admin.password);
    const hashedPassword = await bcryptjs.hash(password, 10);
    console.log("hashed password", hashedPassword);
    const isMatch = await bcryptjs.compare(password, admin.password);

    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    console.log("token", token);


    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Error logging in' });
  }
});

export default router;