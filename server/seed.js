import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@proofjobs.com' },
    update: {},
    create: {
      email: 'admin@proofjobs.com',
      password: adminPassword,
      full_name: 'Admin User',
      role: 'ADMIN',
      phone_verified: true,
      vetting_status: 'approved'
    }
  });

  // Create sample company
  const companyPassword = await bcrypt.hash('company123', 12);
  const company = await prisma.user.upsert({
    where: { email: 'company@example.com' },
    update: {},
    create: {
      email: 'company@example.com',
      password: companyPassword,
      full_name: 'John Smith',
      role: 'COMPANY',
      company_name: 'Elite Forensic Accounting',
      company_size: '11-50',
      industry: 'Accounting Firm',
      location: 'New York, NY',
      website: 'https://eliteforensic.com',
      phone_verified: true,
      vetting_status: 'approved',
      subscription_tier: 'professional'
    }
  });

  // Create sample jobseeker
  const jobseekerPassword = await bcrypt.hash('jobseeker123', 12);
  const jobseeker = await prisma.user.upsert({
    where: { email: 'jobseeker@example.com' },
    update: {},
    create: {
      email: 'jobseeker@example.com',
      password: jobseekerPassword,
      full_name: 'Sarah Johnson',
      role: 'JOBSEEKER',
      phone: '+1-555-0123',
      phone_verified: true,
      vetting_status: 'approved'
    }
  });

  // Create jobseeker bio
  await prisma.jobseekerBio.upsert({
    where: { user_id: jobseeker.id },
    update: {},
    create: {
      user_id: jobseeker.id,
      bio_text: 'Experienced forensic accountant with 5+ years specializing in fraud detection and financial investigations. CPA certified with expertise in litigation support.',
      skills: JSON.stringify(['Financial Analysis', 'Fraud Detection', 'Data Analytics', 'Expert Testimony', 'Risk Assessment']),
      experience_level: 'mid',
      specialization: 'Fraud Detection',
      certifications: JSON.stringify(['CPA', 'CFE']),
      salary_range_min: 75000,
      salary_range_max: 95000,
      desired_job_types: JSON.stringify(['Full-time', 'Contract']),
      work_preference: 'remote',
      availability: 'Within 2 weeks'
    }
  });

  // Create sample job post
  const jobPost = await prisma.jobPost.create({
    data: {
      title: 'Senior Forensic Accountant',
      description: 'We are seeking an experienced forensic accountant to join our growing team. The ideal candidate will have expertise in fraud detection, financial investigations, and litigation support.',
      job_type: 'full_time',
      work_location: 'hybrid',
      location: 'New York, NY',
      salary_range_min: 80000,
      salary_range_max: 120000,
      experience_level: 'mid',
      industry: 'Accounting Firm',
      required_skills: JSON.stringify(['Financial Analysis', 'Fraud Detection', 'Attention to Detail']),
      status: 'active',
      company_user_id: company.id,
      company_name: 'Elite Forensic Accounting'
    }
  });

  // Create sample challenge
  const challenge = await prisma.challenge.create({
    data: {
      job_post_id: jobPost.id,
      title: 'Financial Statement Analysis',
      description: 'Review the provided financial statements and identify potential red flags that might indicate fraudulent activity. Provide a detailed analysis of your findings.',
      challenge_type: 'custom',
      difficulty: 'intermediate',
      category: 'fraud_detection',
      time_limit_minutes: 60,
      created_by_user_id: company.id
    }
  });

  // Initialize form fields - Skip for now to get app running
  // const jobseekerFields = [
  //   { name: 'full_name', label: 'Full Name', type: 'text', required: true, visible: true, order: 1, form_type: 'jobseeker', options: [] },
  //   { name: 'phone', label: 'Phone Number', type: 'tel', required: false, visible: true, order: 2, form_type: 'jobseeker', options: [] },
  //   { name: 'experience_level', label: 'Experience Level', type: 'select', required: true, visible: true, order: 3, form_type: 'jobseeker', options: ['Entry', 'Mid', 'Senior', 'Executive'] },
  //   { name: 'specialization', label: 'Specialization Area', type: 'select', required: false, visible: true, order: 4, form_type: 'jobseeker', options: ['Fraud Detection', 'Financial Investigation', 'Litigation Support', 'Compliance', 'Risk Assessment'] }
  // ];

  // const companyFields = [
  //   { name: 'company_name', label: 'Company Name', type: 'text', required: true, visible: true, order: 1, form_type: 'company', options: [] },
  //   { name: 'company_size', label: 'Company Size', type: 'select', required: true, visible: true, order: 2, form_type: 'company', options: ['1-10', '11-50', '51-200', '201-500', '500+'] },
  //   { name: 'industry', label: 'Industry', type: 'select', required: true, visible: true, order: 3, form_type: 'company', options: ['Accounting Firm', 'Law Firm', 'Insurance', 'Banking', 'Government', 'Corporate', 'Consulting'] }
  // ];

  // await prisma.formField.createMany({
  //   data: [...jobseekerFields, ...companyFields],
  //   skipDuplicates: true
  // });

  console.log('✅ Database seeded successfully!');
  console.log('🔑 Admin login: admin@proofjobs.com / admin123');
  console.log('🏢 Company login: company@example.com / company123');
  console.log('👤 Jobseeker login: jobseeker@example.com / jobseeker123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
