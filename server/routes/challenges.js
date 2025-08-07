import express from 'express';
import crypto from 'crypto';
import { authenticateToken, requireCompany } from '../middleware/auth.js';

const router = express.Router();

// Helper function to generate content hash for duplicate detection
const generateContentHash = (content) => {
  return crypto.createHash('sha256').update(content.toLowerCase().trim()).digest('hex');
};

// Create challenge
router.post('/', authenticateToken, requireCompany, async (req, res) => {
  try {
    const challengeData = {
      ...req.body,
      created_by_user_id: req.user.id
    };

    // Generate content hash for duplicate detection
    if (challengeData.challenge_type === 'ai_generated') {
      const content = challengeData.title + challengeData.description;
      challengeData.content_hash = generateContentHash(content);

      // Check for duplicates
      const existingChallenge = await req.prisma.challenge.findFirst({
        where: { content_hash: challengeData.content_hash }
      });

      if (existingChallenge) {
        return res.status(400).json({ 
          error: 'A similar challenge already exists. Please regenerate or modify the content.' 
        });
      }
    }

    const challenge = await req.prisma.challenge.create({
      data: challengeData
    });

    // If there's an answer key, create it
    if (req.body.correct_answer) {
      await req.prisma.aIChallengeAnswerKey.create({
        data: {
          challenge_id: challenge.id,
          correct_answer: req.body.correct_answer,
          answer_explanation: req.body.answer_explanation
        }
      });
    }

    res.status(201).json(challenge);
  } catch (error) {
    console.error('Create challenge error:', error);
    res.status(500).json({ error: 'Failed to create challenge' });
  }
});

// Get challenges for a job
router.get('/job/:jobId', async (req, res) => {
  try {
    const challenges = await req.prisma.challenge.findMany({
      where: { job_post_id: req.params.jobId },
      orderBy: { created_at: 'desc' }
    });

    res.json(challenges);
  } catch (error) {
    console.error('Get challenges error:', error);
    res.status(500).json({ error: 'Failed to get challenges' });
  }
});

// Get single challenge
router.get('/:id', async (req, res) => {
  try {
    const challenge = await req.prisma.challenge.findUnique({
      where: { id: req.params.id },
      include: {
        answer_key: true,
        job_post: {
          select: {
            title: true,
            company_name: true
          }
        }
      }
    });

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    res.json(challenge);
  } catch (error) {
    console.error('Get challenge error:', error);
    res.status(500).json({ error: 'Failed to get challenge' });
  }
});

// Update challenge
router.put('/:id', authenticateToken, requireCompany, async (req, res) => {
  try {
    // Verify ownership
    const existingChallenge = await req.prisma.challenge.findUnique({
      where: { id: req.params.id },
      include: {
        job_post: {
          select: { company_user_id: true }
        }
      }
    });

    if (!existingChallenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    if (existingChallenge.job_post.company_user_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to update this challenge' });
    }

    const updates = req.body;
    delete updates.id;
    delete updates.created_by_user_id;

    const challenge = await req.prisma.challenge.update({
      where: { id: req.params.id },
      data: updates
    });

    res.json(challenge);
  } catch (error) {
    console.error('Update challenge error:', error);
    res.status(500).json({ error: 'Failed to update challenge' });
  }
});

// Delete challenge
router.delete('/:id', authenticateToken, requireCompany, async (req, res) => {
  try {
    // Verify ownership
    const existingChallenge = await req.prisma.challenge.findUnique({
      where: { id: req.params.id },
      include: {
        job_post: {
          select: { company_user_id: true }
        }
      }
    });

    if (!existingChallenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    if (existingChallenge.job_post.company_user_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to delete this challenge' });
    }

    await req.prisma.challenge.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Challenge deleted successfully' });
  } catch (error) {
    console.error('Delete challenge error:', error);
    res.status(500).json({ error: 'Failed to delete challenge' });
  }
});

// AI Challenge Generation (simulate AI for now)
router.post('/generate-ai', authenticateToken, requireCompany, async (req, res) => {
  try {
    const { job_title, job_description, difficulty, count = 1 } = req.body;

    const challenges = [];
    const usedHashes = new Set();

    for (let i = 0; i < count; i++) {
      // Simulate AI generation with templates
      const templates = [
        {
          title: `Forensic Analysis Case Study ${i + 1}`,
          description: `Analyze the following financial discrepancies in a ${job_title} context: Review the provided financial statements and identify potential fraud indicators. Consider red flags such as unusual account fluctuations, timing discrepancies, and documentation gaps. Provide your analysis methodology and conclusions.`,
          category: 'fraud_detection'
        },
        {
          title: `Financial Investigation Scenario ${i + 1}`,
          description: `You are investigating a potential embezzlement case for a client. Given the financial records and transaction history, identify suspicious patterns and calculate potential losses. Explain your investigative approach and key findings.`,
          category: 'investigation'
        },
        {
          title: `Compliance Review Challenge ${i + 1}`,
          description: `Review the compliance documentation for a ${job_title} position. Identify gaps in internal controls and suggest improvements to prevent financial misconduct. Focus on segregation of duties and authorization protocols.`,
          category: 'compliance'
        }
      ];

      const template = templates[i % templates.length];
      const content = template.title + template.description;
      const contentHash = generateContentHash(content);

      // Check for duplicates
      if (!usedHashes.has(contentHash)) {
        const existingChallenge = await req.prisma.challenge.findFirst({
          where: { content_hash: contentHash }
        });

        if (!existingChallenge) {
          challenges.push({
            ...template,
            difficulty: difficulty || 'intermediate',
            challenge_type: 'ai_generated',
            content_hash: contentHash,
            correct_answer: 'Sample answer: Analysis should include review of account reconciliations, examination of supporting documentation, and identification of control weaknesses.',
            answer_explanation: 'This challenge tests the candidate\'s ability to systematically approach financial analysis and identify potential issues.'
          });
          usedHashes.add(contentHash);
        }
      }
    }

    if (challenges.length === 0) {
      return res.status(400).json({ 
        error: 'All generated challenges already exist. Please try again for unique content.' 
      });
    }

    res.json({ challenges });
  } catch (error) {
    console.error('Generate AI challenges error:', error);
    res.status(500).json({ error: 'Failed to generate AI challenges' });
  }
});

export default router;
