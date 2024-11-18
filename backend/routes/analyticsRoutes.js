const express = require('express');
const router = express.Router();
const Email = require('../models/Email');

router.get('/', async (req, res) => {
    try {
        const [
            totalSent,
            pending,
            scheduled,
            failed,
            delivered,
            opened,
            bounced
        ] = await Promise.all([
            Email.countDocuments({ user: req.user._id, status: 'sent' }),
            Email.countDocuments({ user: req.user._id, status: 'pending' }),
            Email.countDocuments({ user: req.user._id, status: 'scheduled' }),
            Email.countDocuments({ user: req.user._id, status: 'failed' }),
            Email.countDocuments({ user: req.user._id, deliveryStatus: 'delivered' }),
            Email.countDocuments({ user: req.user._id, deliveryStatus: 'opened' }),
            Email.countDocuments({ user: req.user._id, deliveryStatus: 'bounced' })
        ]);

        console.log('Analytics counts:', {
            totalSent,
            delivered,
            opened,
            bounced,
            user: req.user._id
        });

        const total = totalSent;
        const responseRate = total > 0 ? ((opened / total) * 100).toFixed(2) : 0;

        console.log('Response rate calculation:', {
            total,
            opened,
            responseRate
        });

        res.json({
            totalSent,
            pending,
            scheduled,
            failed,
            responseRate: parseFloat(responseRate),
            deliveryStatus: {
                delivered,
                opened,
                bounced,
                failed
            }
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

module.exports = router; 