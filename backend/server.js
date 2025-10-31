// Load environment variables first
require('dotenv').config({ path: __dirname + '/.env' });

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const speech = require('@google-cloud/speech');
const fs = require('fs');

// Initialize Google Speech-to-Text client (optional)
let speechClient = null;
const googleCredPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './google-credentials.json';

if (fs.existsSync(googleCredPath)) {
  try {
    speechClient = new speech.SpeechClient({
      keyFilename: googleCredPath
    });
    console.log('🎤 Google Speech-to-Text client initialized');
  } catch (error) {
    console.warn('⚠️  Failed to initialize Google Speech-to-Text client:', error.message);
    console.warn('   Transcription will be disabled');
  }
} else {
  console.warn('⚠️  Google credentials file not found at:', googleCredPath);
  console.warn('   Transcription will be disabled. To enable:');
  console.warn('   1. Get credentials from Google Cloud Console');
  console.warn('   2. Save as google-credentials.json in backend folder');
  console.warn('   3. Or set GOOGLE_APPLICATION_CREDENTIALS env var');
}

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

// Configure multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// --- MOCK DATA: Dummy Opportunities ---
const DUMMY_OPPORTUNITIES = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    title: "Product Role (Internal)",
    company: "Vetted AI",
    location: "Remote (Global)",
    type: "Full-time",
    rate: "N/A",
    skills: ["Product Management", "Design", "Strategy"],
    questions: [
      { question_text: "Tell us about yourself.", time_limit_seconds: 90 },
      { question_text: "Why do you want to work at Vetted AI?", time_limit_seconds: 90 },
      { question_text: "Describe a product you built from scratch.", time_limit_seconds: 120 },
      { question_text: "How do you prioritize features in a backlog?", time_limit_seconds: 90 },
      { question_text: "What's your approach to user research?", time_limit_seconds: 90 },
      { question_text: "Tell us about a challenging stakeholder situation.", time_limit_seconds: 120 },
      { question_text: "How do you measure product success?", time_limit_seconds: 90 },
      { question_text: "Describe your experience with A/B testing.", time_limit_seconds: 90 },
      { question_text: "How do you balance user needs with business goals?", time_limit_seconds: 120 },
      { question_text: "What's your product development process?", time_limit_seconds: 90 },
      { question_text: "How do you handle conflicting feedback?", time_limit_seconds: 90 },
      { question_text: "Describe a failed product and what you learned.", time_limit_seconds: 120 },
      { question_text: "How do you work with engineering teams?", time_limit_seconds: 90 },
      { question_text: "What product management tools do you use?", time_limit_seconds: 60 },
      { question_text: "Why product management at Vetted AI?", time_limit_seconds: 90 }
    ]
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    title: "Senior Backend Engineer",
    company: "CongratsAI",
    location: "Remote (Europe)",
    type: "Contract",
    rate: "$90-120/hr",
    skills: ["Node.js", "PostgreSQL", "Express", "Supabase", "TypeScript"],
    questions: [
      { question_text: "Introduce yourself and your background.", time_limit_seconds: 90 },
      { question_text: "What's your experience with Node.js at scale?", time_limit_seconds: 120 },
      { question_text: "Explain how you design RESTful APIs.", time_limit_seconds: 90 },
      { question_text: "How do you handle database optimization?", time_limit_seconds: 120 },
      { question_text: "Describe a challenging performance issue you solved.", time_limit_seconds: 120 },
      { question_text: "How do you approach microservices architecture?", time_limit_seconds: 90 },
      { question_text: "What's your experience with PostgreSQL?", time_limit_seconds: 90 },
      { question_text: "How do you handle authentication and authorization?", time_limit_seconds: 90 },
      { question_text: "Describe your testing strategy.", time_limit_seconds: 90 },
      { question_text: "How do you ensure API security?", time_limit_seconds: 120 },
      { question_text: "What's your experience with real-time systems?", time_limit_seconds: 90 },
      { question_text: "How do you handle errors and logging?", time_limit_seconds: 90 },
      { question_text: "Describe your deployment process.", time_limit_seconds: 90 },
      { question_text: "What's your experience with TypeScript?", time_limit_seconds: 60 },
      { question_text: "Why do you want to work with CongratsAI?", time_limit_seconds: 90 }
    ]
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440003",
    title: "ML Engineer (Computer Vision)",
    company: "VisionFlow AI",
    location: "Hybrid (Paris)",
    type: "Full-time",
    rate: "€80-100/hr",
    skills: ["Python", "TensorFlow", "PyTorch", "Computer Vision", "Docker"],
    questions: [
      { question_text: "Tell us about your background in machine learning.", time_limit_seconds: 90 },
      { question_text: "What computer vision projects have you worked on?", time_limit_seconds: 120 },
      { question_text: "Explain your approach to model training.", time_limit_seconds: 120 },
      { question_text: "How do you handle imbalanced datasets?", time_limit_seconds: 90 },
      { question_text: "Describe your experience with deep learning frameworks.", time_limit_seconds: 90 },
      { question_text: "How do you optimize model performance?", time_limit_seconds: 120 },
      { question_text: "What's your experience with object detection?", time_limit_seconds: 90 },
      { question_text: "How do you handle data augmentation?", time_limit_seconds: 90 },
      { question_text: "Describe your model deployment experience.", time_limit_seconds: 120 },
      { question_text: "How do you evaluate model accuracy?", time_limit_seconds: 90 },
      { question_text: "What's your experience with transfer learning?", time_limit_seconds: 90 },
      { question_text: "How do you handle overfitting?", time_limit_seconds: 90 },
      { question_text: "Describe your data preprocessing pipeline.", time_limit_seconds: 90 },
      { question_text: "What hardware do you prefer for training?", time_limit_seconds: 60 },
      { question_text: "Why VisionFlow AI?", time_limit_seconds: 90 }
    ]
  }
];

// --- Endpoint 1: Job List (Mock Data) ---
app.get('/api/opportunities', async (req, res) => {
  try {
    console.log(`✅ Returning ${DUMMY_OPPORTUNITIES.length} mock opportunities`);
    res.json(DUMMY_OPPORTUNITIES);
  } catch (error) {
    console.error('❌ Error in /api/opportunities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch opportunities'
    });
  }
});

// --- NEW Endpoint 2: Per-Question Answer Submission ---
app.post('/api/audition/submit-answer', upload.single('audio_file'), async (req, res) => {
  try {
    console.log('📥 Received per-question submission');
    
    // A. Get Data from request body
    const { opportunityId, userId, questionId, questionText } = req.body;
    
    console.log(`  └─ User: ${userId}`);
    console.log(`  └─ Opportunity: ${opportunityId}`);
    console.log(`  └─ Question: ${questionId}`);
    console.log(`  └─ Question Text: ${questionText}`);

    // Validate required fields
    if (!opportunityId || !userId || !questionId || !questionText) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: opportunityId, userId, questionId, or questionText'
      });
    }

    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No audio file provided'
      });
    }

    const file = req.file;
    console.log(`📦 File received: ${file.originalname} (${(file.size / 1024).toFixed(2)} KB)`);

    // B. Upload File to Supabase Storage
    const timestamp = Date.now();
    const filePath = `answers/${userId}/${opportunityId}/${questionId}_${timestamp}.webm`;
    
    console.log(`⬆️  Uploading to Supabase Storage: ${filePath}`);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audition-recordings')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      throw new Error(`Failed to upload audio: ${uploadError.message}`);
    }

    console.log(`✅ File uploaded successfully`);

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('audition-recordings')
      .getPublicUrl(filePath);

    // C. Transcribe Audio with Google Speech-to-Text
    let transcript = '';
    
    if (speechClient) {
      console.log('🎤 Transcribing audio with Google Speech-to-Text...');
      
      try {
        const audioBytes = file.buffer.toString('base64');
        
        const request = {
          audio: {
            content: audioBytes,
          },
          config: {
            encoding: 'WEBM_OPUS',
            sampleRateHertz: 48000,
            languageCode: 'en-US',
            enableAutomaticPunctuation: true,
          },
        };

        const [response] = await speechClient.recognize(request);
        const transcription = response.results
          .map(result => result.alternatives[0].transcript)
          .join('\n');
        
        transcript = transcription || '[No speech detected]';
        console.log(`✅ Transcription complete: "${transcript.substring(0, 100)}${transcript.length > 100 ? '...' : ''}"`);
        
      } catch (transcriptionError) {
        console.warn('⚠️  Transcription failed:', transcriptionError.message);
        transcript = '[Transcription unavailable]';
      }
    } else {
      console.log('⏭️  Skipping transcription (Google credentials not configured)');
      transcript = '[Transcription disabled - Google credentials not configured]';
    }

    // D. Save to Database (audition_answers table)
    console.log('💾 Saving answer to database...');

    const { data: answerData, error: dbError } = await supabase
      .from('audition_answers')
      .insert({
        user_id: userId,
        opportunity_id: opportunityId,
        question_id: questionId,
        question_text: questionText,
        audio_url: publicUrl,
        audio_path: filePath,
        transcript: transcript,
        submitted_at: new Date().toISOString()
      })
      .select();

    if (dbError) {
      console.error('❌ Database error:', dbError);
      throw new Error(`Failed to save answer: ${dbError.message}`);
    }

    console.log(`✅ Answer saved to database (ID: ${answerData[0].id})`);

    // E. Respond with success
    res.status(200).json({
      success: true,
      message: 'Answer submitted successfully',
      data: {
        answerId: answerData[0].id,
        audioUrl: publicUrl,
        transcript: transcript,
        questionId: questionId
      }
    });

  } catch (error) {
    console.error('❌ Error in submit-answer:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process answer submission'
    });
  }
});

// --- Endpoint 3: Create Submission Record ---
app.post('/api/audition/create-submission', async (req, res) => {
  try {
    console.log('📝 Creating audition submission record');
    
    // Get data from request body
    const { userId, opportunityId, questions, totalDuration } = req.body;
    
    console.log(`  └─ User ID: ${userId}`);
    console.log(`  └─ Opportunity ID: ${opportunityId}`);
    console.log(`  └─ Questions: ${questions?.length || 0}`);
    console.log(`  └─ Total Duration: ${totalDuration || 0}s`);
    
    // Validate required fields
    if (!userId || !opportunityId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId and opportunityId are required'
      });
    }
    
    console.log('💾 Checking for existing submission...');
    
    // Check if submission already exists
    const { data: existingSubmission, error: checkError } = await supabase
      .from('audition_submissions')
      .select('id, status')
      .eq('user_id', userId)
      .eq('opportunity_id', opportunityId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is expected if no submission exists
      console.error('❌ Check error:', checkError);
      throw new Error(`Failed to check existing submission: ${checkError.message}`);
    }
    
    // If submission exists, update it with questions data if provided
    if (existingSubmission) {
      console.log(`♻️  Existing submission found (ID: ${existingSubmission.id})`);
      
      // Update with questions and duration if provided
      if (questions && questions.length > 0) {
        console.log('📝 Updating existing submission with questions data...');
        const { error: updateError } = await supabase
          .from('audition_submissions')
          .update({
            questions: questions,
            duration_seconds: totalDuration || 0
          })
          .eq('id', existingSubmission.id);
        
        if (updateError) {
          console.error('❌ Update error:', updateError);
        } else {
          console.log(`✅ Updated with ${questions.length} questions (${totalDuration}s)`);
        }
      }
      
      return res.status(200).json({
        success: true,
        message: 'Submission already exists',
        data: {
          submissionId: existingSubmission.id,
          isExisting: true,
          status: existingSubmission.status
        }
      });
    }
    
    console.log('💾 Creating new submission record...');
    
    // Create submission record with questions and duration
    const { data: submissionData, error: insertError } = await supabase
      .from('audition_submissions')
      .insert({
        user_id: userId,
        opportunity_id: opportunityId,
        questions: questions || [], // Store the questions array
        audio_urls: [], // Will be populated from audition_answers
        status: 'pending_review',
        duration_seconds: totalDuration || 0 // Store total duration
      })
      .select();
    
    if (insertError) {
      console.error('❌ Insert error:', insertError);
      throw new Error(`Failed to create submission: ${insertError.message}`);
    }
    
    if (!submissionData || submissionData.length === 0) {
      throw new Error('Failed to create submission record');
    }
    
    console.log(`✅ Submission created successfully (ID: ${submissionData[0].id})`);
    console.log(`  └─ Questions saved: ${questions?.length || 0}`);
    console.log(`  └─ Duration: ${totalDuration || 0}s`);
    
    // Respond with submission ID
    res.status(200).json({
      success: true,
      message: 'Submission created successfully',
      data: {
        submissionId: submissionData[0].id,
        isExisting: false,
        status: 'pending_review'
      }
    });
    
  } catch (error) {
    console.error('❌ Error in create-submission:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create submission'
    });
  }
});

// --- Endpoint 4: Submit Survey Feedback ---
app.post('/api/audition/submit-survey', async (req, res) => {
  try {
    console.log('📊 Received survey submission');
    
    // Get data from request body
    const { submissionId, rating, reason, feedbackText } = req.body;
    
    console.log(`  └─ Submission ID: ${submissionId}`);
    console.log(`  └─ Rating: ${rating}/5`);
    console.log(`  └─ Reason: ${reason}`);
    
    // Validate required fields
    if (!submissionId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: submissionId and rating are required'
      });
    }
    
    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }
    
    // Prepare update data
    const updateData = {
      rating: rating,
      feedback_reason: reason || null,
      feedback_text: feedbackText || null,
    };
    
    // CRITICAL: If reason is "technical", flag for technical review
    if (reason === "technical") {
      updateData.status = 'pending_technical_review';
      console.log('  └─ 🔧 Flagging for technical review');
    }
    
    console.log('💾 Updating submission with survey data...');
    
    // Update the submission in database
    const { data: submissionData, error: updateError } = await supabase
      .from('audition_submissions')
      .update(updateData)
      .eq('id', submissionId)
      .select();
    
    if (updateError) {
      console.error('❌ Update error:', updateError);
      throw new Error(`Failed to save survey: ${updateError.message}`);
    }
    
    if (!submissionData || submissionData.length === 0) {
      throw new Error('Submission not found');
    }
    
    console.log(`✅ Survey saved successfully for submission ${submissionId}`);
    
    // Respond with success
    res.status(200).json({
      success: true,
      message: 'Survey submitted successfully',
      data: {
        submissionId: submissionId,
        rating: rating,
        flaggedForTechnicalReview: reason === "technical"
      }
    });
    
  } catch (error) {
    console.error('❌ Error in submit-survey:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process survey submission'
    });
  }
});

// --- Endpoint 5: Get Submission Details with Answers ---
app.get('/api/submissions/:id', async (req, res) => {
  try {
    const submissionId = req.params.id;
    console.log(`📥 Fetching submission details for ID: ${submissionId}`);

    // Fetch the main submission record
    const { data: submission, error: submissionError } = await supabase
      .from('audition_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (submissionError) {
      console.error('❌ Error fetching submission:', submissionError);
      
      // Handle "not found" error specifically
      if (submissionError.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Submission not found'
        });
      }
      
      throw new Error(`Failed to fetch submission: ${submissionError.message}`);
    }

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found'
      });
    }

    console.log(`✅ Submission found`);
    console.log(`  └─ Opportunity ID: ${submission.opportunity_id}`);
    console.log(`  └─ Status: ${submission.status}`);

    // Fetch all answers for this submission (by matching user_id and opportunity_id)
    const { data: answers, error: answersError } = await supabase
      .from('audition_answers')
      .select('id, question_id, question_text, audio_url, transcript, submitted_at')
      .eq('user_id', submission.user_id)
      .eq('opportunity_id', submission.opportunity_id)
      .order('submitted_at', { ascending: true });

    if (answersError) {
      console.error('❌ Error fetching answers:', answersError);
      throw new Error(`Failed to fetch answers: ${answersError.message}`);
    }

    console.log(`✅ Found ${answers?.length || 0} answers`);

    // Fetch opportunity details to include title, company, etc.
    const opportunity = DUMMY_OPPORTUNITIES.find(opp => opp.id === submission.opportunity_id);

    // Combine data into one response object
    const responseData = {
      id: submission.id,
      userId: submission.user_id,
      opportunityId: submission.opportunity_id,
      
      // Opportunity details (from mock data)
      title: opportunity?.title || 'Unknown Position',
      company: opportunity?.company || 'Unknown Company',
      location: opportunity?.location || 'Unknown Location',
      type: opportunity?.type || 'Full-time',
      rate: opportunity?.rate || 'N/A',
      
      // Submission details
      status: submission.status,
      submittedAt: submission.submitted_at,
      durationSeconds: submission.duration_seconds,
      
      // Survey feedback (if provided)
      rating: submission.rating,
      feedbackReason: submission.feedback_reason,
      feedbackText: submission.feedback_text,
      
      // Questions metadata (stored in submission)
      questions: submission.questions || [],
      
      // All answers with audio
      answers: answers.map(answer => ({
        id: answer.id,
        questionId: answer.question_id,
        questionText: answer.question_text,
        audioUrl: answer.audio_url,
        transcript: answer.transcript,
        submittedAt: answer.submitted_at
      }))
    };

    console.log(`✅ Sending complete submission data with ${responseData.answers.length} answers`);

    res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('❌ Error in /api/submissions/:id:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch submission details'
    });
  }
});

// --- Endpoint 6: Get All Submissions for a User ---
app.get('/api/submissions', async (req, res) => {
  try {
    const userId = req.query.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId query parameter is required'
      });
    }

    console.log(`📥 Fetching all submissions for user: ${userId}`);

    // Fetch all submissions for the user
    const { data: submissions, error: submissionsError } = await supabase
      .from('audition_submissions')
      .select('*')
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false });

    if (submissionsError) {
      console.error('❌ Error fetching submissions:', submissionsError);
      throw new Error(`Failed to fetch submissions: ${submissionsError.message}`);
    }

    console.log(`✅ Found ${submissions?.length || 0} submissions`);

    // Enrich each submission with opportunity details
    const enrichedSubmissions = submissions.map(submission => {
      const opportunity = DUMMY_OPPORTUNITIES.find(opp => opp.id === submission.opportunity_id);
      
      return {
        id: submission.id,
        title: opportunity?.title || 'Unknown Position',
        company: opportunity?.company || 'Unknown Company',
        location: opportunity?.location || 'Unknown Location',
        type: opportunity?.type || 'Full-time',
        rate: opportunity?.rate || 'N/A',
        status: submission.status,
        submittedAt: submission.submitted_at,
        opportunityId: submission.opportunity_id,
        durationSeconds: submission.duration_seconds,
        rating: submission.rating
      };
    });

    res.status(200).json({
      success: true,
      data: enrichedSubmissions
    });

  } catch (error) {
    console.error('❌ Error in /api/submissions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch submissions'
    });
  }
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Backend server running on port ${PORT}`);
  console.log(`📡 Endpoints available:`);
  console.log(`   GET  /api/opportunities`);
  console.log(`   POST /api/audition/submit-answer`);
  console.log(`   POST /api/audition/create-submission`);
  console.log(`   POST /api/audition/submit-survey`);
  console.log(`   GET  /api/submissions/:id`);
  console.log(`   GET  /api/submissions?userId=<id>`);
});
