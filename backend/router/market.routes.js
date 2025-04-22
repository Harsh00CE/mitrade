import express from 'express';
import MarketSchema from '../schemas/marketSchema.js';

const router = express.Router();

// GET market status
router.get('/market-status', async (req, res) => {
    try {
        const market = await MarketSchema.findOne().sort({ createdAt: -1 });
        if (!market) return res.status(404).json({ error: 'Market data not found' });

        res.json({
            isMarketOn: market.isMarketOn,
            closeReason: market.closeReason,
            nextScheduledClose: market.nextScheduledClose,
            nextScheduledReopen: market.nextScheduledReopen,
            updatedAt: market.updatedAt,
            createdAt: market.createdAt,
            success: true,
        });
    } catch (err) {
        console.error('Error fetching market status:', err);
        res.status(500).json({ error: 'Internal server error', success: false });
    }
});

// TOGGLE market
router.post('/toggle-market', async (req, res) => {
    try {
        const { closeReason } = req.body;
        let market = await MarketSchema.findOne().sort({ createdAt: -1 });

        if (!market) {
            market = new MarketSchema();
        }

        if (market.isMarketOn) {
            if (!closeReason) {
                return res.status(400).json({ error: 'Close reason is required', success: false });
            }
            market.isMarketOn = false;
            market.closeReason = closeReason;
        } else {
            market.isMarketOn = true;
            market.closeReason = '';
        }

        market.updatedAt = new Date();
        await market.save();

        res.json({
            message: `Market ${market.isMarketOn ? 'opened' : 'closed'} successfully`,
            isMarketOn: market.isMarketOn,
            closeReason: market.closeReason,
            success: true,
        });
    } catch (err) {
        console.error('Error toggling market status:', err);
        res.status(500).json({ error: 'Failed to toggle market', success: false });
    }
});

// SET scheduled close/reopen
router.post('/set-reminder', async (req, res) => {
    try {
        const { closeAt, reopenAt } = req.body;

        let market = await MarketSchema.findOne().sort({ createdAt: -1 });
        if (!market) {
            market = new MarketSchema();
        }

        if (closeAt) market.nextScheduledClose = new Date(closeAt);
        if (reopenAt) market.nextScheduledReopen = new Date(reopenAt);

        market.updatedAt = new Date();
        await market.save();

        res.json({
            message: 'Scheduled times updated successfully',
            nextScheduledClose: market.nextScheduledClose,
            nextScheduledReopen: market.nextScheduledReopen,
            success: true,
        });
    } catch (err) {
        console.error('Error setting schedule:', err);
        res.status(500).json({ error: 'Failed to update schedule', success: false });
    }
});
// CREATE new market document
router.post('/create-market', async (req, res) => {
    try {
        const {
            isMarketOn = true,
            closeReason = '',
            nextScheduledClose = null,
            nextScheduledReopen = null,
        } = req.body;

        const newMarket = new MarketSchema({
            isMarketOn,
            closeReason,
            nextScheduledClose: nextScheduledClose ? new Date(nextScheduledClose) : null,
            nextScheduledReopen: nextScheduledReopen ? new Date(nextScheduledReopen) : null,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await newMarket.save();

        res.status(201).json({
            message: 'Market created successfully',
            market: newMarket,
            success: true,
        });
    } catch (err) {
        console.error('Error creating market:', err);
        res.status(500).json({ error: 'Failed to create market', success: false });
    }
});


export default router;
