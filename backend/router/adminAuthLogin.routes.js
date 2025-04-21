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


router.post('/toggle-market', async (req, res) => {
  try {
    const admin = await AdminSchema.findOne().sort({ createdAt: -1 });
    if (!admin) {
      return res.status(404).json({ error: 'Admin configuration not found' });
    }

    admin.isMarketOn = !admin.isMarketOn;
    await admin.save();

    res.json({
      message: `Market ${admin.isMarketOn ? 'opened' : 'closed'} successfully`,
      isMarketOn: admin.isMarketOn
    });
  } catch (err) {
    console.error('Market toggle error:', err);
    res.status(500).json({ error: 'Error toggling market status' });
  }
});

// Set scheduled close reminder (doesn't auto-close)
router.post('/set-reminder', async (req, res) => {
  try {
    const { closeAt } = req.body;

    if (!closeAt) {
      return res.status(400).json({ error: 'Close time is required' });
    }

    const admin = await AdminSchema.findOne().sort({ createdAt: -1 });
    if (!admin) {
      return res.status(404).json({ error: 'Admin configuration not found' });
    }

    admin.nextScheduledClose = new Date(closeAt);
    await admin.save();

    res.json({
      message: 'Market close reminder set successfully',
      nextScheduledClose: admin.nextScheduledClose,
      reminder: `Market will not close automatically. Admin must manually close at ${closeAt}`
    });
  } catch (err) {
    console.error('Set reminder error:', err);
    res.status(500).json({ error: 'Error setting reminder' });
  }
});

// Get current market status and reminders
router.get('/market-status', async (req, res) => {
  try {
    const admin = await AdminSchema.findOne().sort({ createdAt: -1 });
    if (!admin) {
      return res.status(404).json({ error: 'Admin configuration not found' });
    }

    return res.json({
      isMarketOn: admin.isMarketOn,
      nextScheduledClose: admin.nextScheduledClose,
      shouldCloseNow: admin.nextScheduledClose && new Date(admin.nextScheduledClose) <= new Date()
    });
  } catch (err) {
    console.error('Market status error:', err);
    res.status(500).json({ error: 'Error getting market status' });
  }
});


export default router;