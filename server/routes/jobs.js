import express from 'express';
import { authenticateToken, requireCompany } from '../middleware/auth.js';

const router = express.Router();

// Get all jobs
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, location, job_type } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      status: 'active'
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { company_name: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (location) {
      where.OR = [
        { location: { contains: location, mode: 'insensitive' } },
        { work_location: { contains: location, mode: 'insensitive' } }
      ];
    }

    if (job_type) {
      where.job_type = job_type;
    }

    const jobs = await req.prisma.jobPost.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { created_at: 'desc' },
      include: {
        challenges: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            category: true
          }
        }
      }
    });

    const total = await req.prisma.jobPost.count({ where });

    res.json({
      jobs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Failed to get jobs' });
  }
});

// Get single job
router.get('/:id', async (req, res) => {
  try {
    const job = await req.prisma.jobPost.findUnique({
      where: { id: req.params.id },
      include: {
        challenges: true,
        company: {
          select: {
            id: true,
            full_name: true,
            company_name: true,
            location: true,
            website: true
          }
        }
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ error: 'Failed to get job' });
  }
});

// Create job
router.post('/', authenticateToken, requireCompany, async (req, res) => {
  try {
    const jobData = {
      ...req.body,
      company_user_id: req.user.id,
      company_name: req.user.company_name || req.user.full_name
    };

    const job = await req.prisma.jobPost.create({
      data: jobData,
      include: {
        challenges: true
      }
    });

    res.status(201).json(job);
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// Update job
router.put('/:id', authenticateToken, requireCompany, async (req, res) => {
  try {
    // Verify ownership
    const existingJob = await req.prisma.jobPost.findUnique({
      where: { id: req.params.id },
      select: { company_user_id: true }
    });

    if (!existingJob) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (existingJob.company_user_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to update this job' });
    }

    const updates = req.body;
    delete updates.id;
    delete updates.company_user_id;

    const job = await req.prisma.jobPost.update({
      where: { id: req.params.id },
      data: updates,
      include: {
        challenges: true
      }
    });

    res.json(job);
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
});

// Delete job
router.delete('/:id', authenticateToken, requireCompany, async (req, res) => {
  try {
    // Verify ownership
    const existingJob = await req.prisma.jobPost.findUnique({
      where: { id: req.params.id },
      select: { company_user_id: true }
    });

    if (!existingJob) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (existingJob.company_user_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to delete this job' });
    }

    await req.prisma.jobPost.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
});

// Get company's jobs
router.get('/company/my-jobs', authenticateToken, requireCompany, async (req, res) => {
  try {
    const jobs = await req.prisma.jobPost.findMany({
      where: { company_user_id: req.user.id },
      orderBy: { created_at: 'desc' },
      include: {
        challenges: {
          select: {
            id: true,
            title: true,
            difficulty: true
          }
        },
        applications: {
          select: {
            id: true,
            status: true,
            created_at: true
          }
        }
      }
    });

    res.json(jobs);
  } catch (error) {
    console.error('Get company jobs error:', error);
    res.status(500).json({ error: 'Failed to get jobs' });
  }
});

export default router;
