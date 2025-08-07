import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, role, ...additionalData } = req.body;

    // Check if user exists
    const existingUser = await req.prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const userData = {
      email,
      password: hashedPassword,
      full_name,
      role: role || 'JOBSEEKER'
    };

    // Add role-specific data
    if (role === 'COMPANY') {
      userData.company_name = additionalData.company_name;
      userData.company_size = additionalData.company_size;
      userData.industry = additionalData.industry;
      userData.location = additionalData.location;
      userData.website = additionalData.website;
    }

    const user = await req.prisma.user.create({
      data: userData,
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        phone_verified: true,
        vetting_status: true,
        company_name: true
      }
    });

    // Create jobseeker bio if needed
    if (role === 'JOBSEEKER') {
      await req.prisma.jobseekerBio.create({
        data: { user_id: user.id }
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user,
      token,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await req.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        full_name: true,
        role: true,
        phone_verified: true,
        vetting_status: true,
        company_name: true,
        subscription_tier: true
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      token,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await req.prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        phone_verified: true,
        role: true,
        subscription_tier: true,
        vetting_status: true,
        company_name: true,
        company_size: true,
        industry: true,
        location: true,
        website: true,
        description: true,
        created_at: true
      }
    });

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

// Update user
router.put('/me', authenticateToken, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.id;
    delete updates.email;
    delete updates.password;

    const user = await req.prisma.user.update({
      where: { id: req.user.id },
      data: updates,
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        phone_verified: true,
        role: true,
        subscription_tier: true,
        vetting_status: true,
        company_name: true,
        company_size: true,
        industry: true,
        location: true,
        website: true
      }
    });

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;
