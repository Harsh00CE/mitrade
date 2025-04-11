import express from 'express';
import countries from '../utils/countries.js';

const router = express.Router();


router.get('/all', (req, res) => {
  res.status(200).json({
    message: 'Countries fetched successfully',
    countries
  });
});

export default router;
