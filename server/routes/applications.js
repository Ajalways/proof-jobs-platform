import express from 'express';
import { authenticateToken, requireJobseeker, requireCompany } from '../middleware/auth.js';

const router = express.Router();

// Apply to job
router.post('/', authenticateToken, requireJobseeker, async (req, res) => {
  try {
    const { job_post_id, cover_letter, notes } = req.body;

    // Check if already applied
    const existingApplication = await req.prisma.jobApplication.findUnique({
      where: {
        job_post_id_jobseeker_user_id: {
          job_post_id,
          jobseeker_user_id: req.user.id
        }
      }
    });

    if (existingApplication) {
      return res.status(400).json({ error: 'Already applied to this job' });
    }

    const application = await req.prisma.jobApplication.create({
      data: {
        job_post_id,
        jobseeker_user_id: req.user.id,
        cover_letter,
        notes,
        status: 'pending'
      },
      include: {
        job_post: {
          select: {
            title: true,
            company_name: true
          }
        }
      }
    });

    res.status(201).json(application);
  } catch (error) {
    console.error('Apply to job error:', error);
    res.status(500).json({ error: 'Failed to apply to job' });
  }
});

// Get jobseeker's applications
router.get('/my-applications', authenticateToken, requireJobseeker, async (req, res) => {
  try {
    const applications = await req.prisma.jobApplication.findMany({
      where: { jobseeker_user_id: req.user.id },
      orderBy: { created_at: 'desc' },
      include: {
        job_post: {
          select: {
            id: true,
            title: true,
            company_name: true,
            location: true,
            work_location: true,
            job_type: true,
            salary_range_min: true,
            salary_range_max: true,
            description: true
          }
        }
      }
    });

    res.json(applications);
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Failed to get applications' });
  }
});

// Get applications for company's jobs
router.get('/company-applications', authenticateToken, requireCompany, async (req, res) => {
  try {
    // Get all jobs posted by this company
    const companyJobs = await req.prisma.jobPost.findMany({
      where: { company_user_id: req.user.id },
      select: { id: true, title: true }
    });

    const jobIds = companyJobs.map(job => job.id);

    if (jobIds.length === 0) {
      return res.json([]);
    }

    const applications = await req.prisma.jobApplication.findMany({
      where: {
        job_post_id: { in: jobIds }
      },
      orderBy: { created_at: 'desc' },
      include: {
        job_post: {
          select: {
            id: true,
            title: true,
            company_name: true
          }
        },
        jobseeker: {
          select: {
            id: true,
            full_name: true,
            email: true,
            jobseeker_bio: {
              select: {
                bio_text: true,
                skills: true,
                experience_level: true,
                specialization: true
              }
            }
          }
        }
      }
    });

    res.json(applications);
  } catch (error) {
    console.error('Get company applications error:', error);
    res.status(500).json({ error: 'Failed to get applications' });
  }
});

// Update application status (company only)
router.put('/:id/status', authenticateToken, requireCompany, async (req, res) => {
  try {
    const { status } = req.body;
    const applicationId = req.params.id;

    // Verify the application belongs to a job posted by this company
    const application = await req.prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        job_post: {
          select: { company_user_id: true }
        }
      }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (application.job_post.company_user_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to update this application' });
    }

    const updatedApplication = await req.prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status },
      include: {
        job_post: {
          select: {
            title: true,
            company_name: true
          }
        },
        jobseeker: {
          select: {
            full_name: true,
            email: true
          }
        }
      }
    });

    res.json(updatedApplication);
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ error: 'Failed to update application status' });
  }
});

// Get single application
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const application = await req.prisma.jobApplication.findUnique({
      where: { id: req.params.id },
      include: {
        job_post: true,
        jobseeker: {
          select: {
            id: true,
            full_name: true,
            email: true,
            jobseeker_bio: true
          }
        }
      }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Check permissions
    const isJobseeker = req.user.id === application.jobseeker_user_id;
    const isCompany = req.user.id === application.job_post.company_user_id;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isJobseeker && !isCompany && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to view this application' });
    }

    res.json(application);
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ error: 'Failed to get application' });
  }
});

export default router;
