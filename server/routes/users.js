import express from 'express';
import { authenticateToken, requireJobseeker } from '../middleware/auth.js';

const router = express.Router();

// Get user profile (jobseeker bio)
router.get('/profile', authenticateToken, requireJobseeker, async (req, res) => {
  try {
    const profile = await req.prisma.jobseekerBio.findUnique({
      where: { user_id: req.user.id }
    });

    res.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, requireJobseeker, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.id;
    delete updates.user_id;

    const profile = await req.prisma.jobseekerBio.upsert({
      where: { user_id: req.user.id },
      update: updates,
      create: {
        user_id: req.user.id,
        ...updates
      }
    });

    res.json(profile);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get all users (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const users = await req.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        phone_verified: true,
        vetting_status: true,
        company_name: true,
        created_at: true
      },
      orderBy: { created_at: 'desc' }
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get jobseeker candidates
router.get('/candidates', authenticateToken, async (req, res) => {
  try {
    const candidates = await req.prisma.user.findMany({
      where: {
        role: 'JOBSEEKER',
        vetting_status: 'approved'
      },
      select: {
        id: true,
        full_name: true,
        jobseeker_bio: {
          select: {
            bio_text: true,
            skills: true,
            experience_level: true,
            specialization: true,
            salary_range_min: true,
            salary_range_max: true
          }
        }
      }
    });

    res.json(candidates);
  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({ error: 'Failed to get candidates' });
  }
});

export default router;
