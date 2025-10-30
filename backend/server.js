// Load environment variables first
require('dotenv').config({ path: __dirname + '/.env' });

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client (shared instance)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
console.log('✅ Successfully loaded environment variables and connected to Supabase.');
console.log(`🔑 Using ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE' : 'ANON'} key for backend operations`);

const app = express();
app.use(cors());
app.use(express.json());

// Configure multer to use memory storage (files will be in req.files[n].buffer)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// --- Endpoint 1: Job List ---
app.get('/api/opportunities', async (req, res) => {
  try {
    // Fetch active opportunities from Supabase database
    const { data: opportunities, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching opportunities:', error);
      throw error;
    }

    console.log(`✅ Fetched ${opportunities.length} opportunities from database`);
    res.json(opportunities);

  } catch (error) {
    console.error('❌ Error in /api/opportunities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch opportunities'
    });
  }
});

// --- Endpoint 2: Submission Inbox ---

// --- Endpoint 1: Job List ---
app.get('/api/opportunities', (req, res) => {
  const opportunities = [
    {
      id: "1",
      title: "Backend Engineer",
      company: "Vetted AI",
      location: "Remote (Global)",
      type: "Contract",
      rate: "$90/hr",
      skills: ["Node.js", "Supabase", "Express"],
      questions: [
        "Tell us about a project you are proud of.",
        "How do you structure scalable APIs?",
        "Explain a time you optimized backend performance."
      ]
    },
    {
      id: "2",
      title: "Frontend Developer",
      company: "CongratsAI",
      location: "Remote (Europe)",
      type: "Full-time",
      rate: "$70/hr",
      skills: ["React", "Tailwind", "TypeScript"],
      questions: [
        "Describe your approach to responsive design.",
        "How do you handle component state efficiently?",
        "Show us your favorite UI you built."
      ]
    },
    {
      id: "3",
      title: "ML Engineer",
      company: "VisionFlow",
      location: "Hybrid (Paris)",
      type: "Contract",
      rate: "$100/hr",
      skills: ["Python", "TensorFlow", "FastAPI"],
      questions: [
        "How do you preprocess large datasets?",
        "What’s your experience with production ML pipelines?",
        "How do you handle model versioning?"
      ]
    }
  ];

  res.json(opportunities);
});

// --- Endpoint 2: Submission Inbox ---
app.post('/api/submit-audition', upload.array('audio_files'), async (req, res) => {
  try {
    console.log('📥 Received opportunityId:', req.body.opportunityId);
    console.log('📥 Received userId:', req.body.userId);
    console.log('📥 Received files count:', req.files?.length || 0);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No audio files provided'
      });
    }

    const uploadedFilePaths = [];

    // Loop through each file and upload to Supabase Storage
    for (const file of req.files) {
      // Create unique file path: public/{opportunityId}/{originalname}
      const filePath = `public/${req.body.opportunityId}/${file.originalname}`;
      
      console.log(`⬆️  Uploading ${file.originalname} to Supabase Storage...`);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('audition-recordings')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true // Allow overwriting if file exists
        });

      if (error) {
        console.error('❌ Upload error:', error);
        throw new Error(`Failed to upload ${file.originalname}: ${error.message}`);
      }

      console.log(`✅ Uploaded: ${filePath}`);
      uploadedFilePaths.push(filePath);
    }

    // Get data from request body
    const { opportunityId, userId } = req.body;
    const questions = JSON.parse(req.body.questions);

    console.log('💾 Saving submission to database...');

    // Insert submission record into database
    const { data: submissionData, error: dbError } = await supabase
      .from('audition_submissions')
      .insert({
        opportunity_id: opportunityId,
        user_id: userId,
        questions: questions,
        audio_urls: uploadedFilePaths,
        status: 'pending'
      })
      .select();

    if (dbError) {
      console.error('❌ Database error:', dbError);
      throw new Error(`Failed to save submission: ${dbError.message}`);
    }

    console.log('✅ Submission saved to database:', submissionData[0].id);

    // Send success response with the newly created submission
    res.status(200).json({
      success: true,
      submission: submissionData[0]
    });

  } catch (error) {
    console.error('❌ Error in submit-audition:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to process submission'
    });
  }
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Backend server running on port ${PORT}`);
});
