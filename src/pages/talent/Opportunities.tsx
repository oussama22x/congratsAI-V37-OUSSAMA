import { useState, useEffect } from "react";
import { OpportunityCard } from "@/components/OpportunityCard";
import { AuditionStartModal } from "@/components/AuditionStartModal";
import { AuditionQuestionScreen } from "@/components/AuditionQuestionScreen";
import { AuditionCompleteScreen } from "@/components/AuditionCompleteScreen";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useToast } from "@/hooks/use-toast";

// Backend URL - now pointing to backend folder
const BACKEND_URL = 'http://localhost:4000';

// Question type with duration
interface Question {
  id: string;
  text: string;
  duration: number; // in seconds
}

// Opportunity type
interface Opportunity {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  rate: string;
  skills: string[];
  questions: Question[]; // Updated to use Question type
}

const Opportunities = () => {
  // Get current user
  const { currentUser } = useCurrentUser();
  
  // State for opportunities data
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for modal
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  // State for audition flow
  const [auditionInProgress, setAuditionInProgress] = useState(false);
  const [auditionComplete, setAuditionComplete] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  const { toast } = useToast();

  // Fetch opportunities from backend
  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${BACKEND_URL}/api/opportunities`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch opportunities');
        }
        
        const data = await response.json();
        
        // Transform questions from backend format to frontend format
        const transformedData = data.map((opp: any) => ({
          ...opp,
          questions: (opp.questions || []).map((q: any, index: number) => ({
            id: `q${index + 1}`,
            text: q.question_text || q.text || q, // Support both formats
            duration: q.time_limit_seconds || q.duration || 120, // Use backend time_limit or default
          })),
        }));
        
        setOpportunities(transformedData);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load opportunities';
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOpportunities();
  }, [toast]);

  // Handler functions
  const handleStartAudition = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
  };

  const handleCloseModal = () => {
    setSelectedOpportunity(null);
  };

  const handleBeginAudition = () => {
    setAuditionInProgress(true);
  };

  // NEW: Handler when all questions are completed
  const handleQuestionsComplete = async () => {
    console.log('✅ All questions completed - creating submission record');
    
    if (!selectedOpportunity || !currentUser?.id) {
      console.error('❌ Missing opportunity or user ID');
      return;
    }
    
    try {
      console.log('📝 Calling create-submission endpoint...');
      console.log('👤 User ID:', currentUser.id);
      console.log('🎯 Opportunity ID:', selectedOpportunity.id);
      
      const response = await fetch('http://localhost:4000/api/audition/create-submission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          opportunityId: selectedOpportunity.id,
          questions: selectedOpportunity.questions.map(q => ({
            question_text: q.text,
            time_limit_seconds: q.duration
          })),
          totalDuration: selectedOpportunity.questions.reduce((sum, q) => sum + q.duration, 0)
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create submission');
      }

      const submissionId = result.data.submissionId;
      console.log('✅ Submission created with ID:', submissionId);
      console.log('✅ Submission saved to database - will appear in "My Applications"');
      setSubmissionId(submissionId);
      
      // Go directly to AuditionCompleteScreen (which has the survey built-in)
      setAuditionInProgress(false);
      setAuditionComplete(true);
      
    } catch (error) {
      console.error('❌ Error creating submission:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to proceed to survey. Please try again.",
        variant: "destructive",
      });
    }
  };

  // REMOVED: handleSurveyComplete - no longer needed since we skip AuditionSurveyScreen

  // OLD: Remove this function - no longer needed with per-question submission
  const handleCompleteAudition = async (answers: Blob[]) => {
    // This function is deprecated - keeping for reference only
    // New flow: Each answer is submitted individually via handleUploadAndAdvance
  };

  const handleReturnToDashboard = () => {
    setAuditionComplete(false);
    setSelectedOpportunity(null);
  };

  // If audition is complete, show completion screen (with built-in survey)
  if (auditionComplete) {
    return (
      <AuditionCompleteScreen 
        onReturnToDashboard={handleReturnToDashboard}
        submissionId={submissionId || undefined}
      />
    );
  }

  // If audition is in progress, show the question screen
  if (auditionInProgress && selectedOpportunity && currentUser?.id) {
    return (
      <AuditionQuestionScreen
        questions={selectedOpportunity.questions}
        opportunityId={selectedOpportunity.id}
        userId={currentUser.id}
        onComplete={handleQuestionsComplete}
      />
    );
  }

  // Otherwise, show the opportunities list
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight mb-8">Available Auditions</h1>
        
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <h2 className="text-2xl text-muted-foreground">Loading opportunities...</h2>
          </div>
        )}
        
        {/* Error State */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <h2 className="text-2xl text-destructive">Failed to load opportunities</h2>
            <p className="text-muted-foreground">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Retry
            </button>
          </div>
        )}
        
        {/* Opportunities Grid */}
        {!isLoading && !error && opportunities.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {opportunities.map((opportunity) => (
              <OpportunityCard
                key={opportunity.id}
                title={opportunity.title}
                company={opportunity.company}
                location={opportunity.location}
                type={opportunity.type}
                rate={opportunity.rate}
                skills={opportunity.skills}
                onStartAudition={() => handleStartAudition(opportunity)}
              />
            ))}
          </div>
        )}
        
        {/* Empty State */}
        {!isLoading && !error && opportunities.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <h2 className="text-2xl text-muted-foreground">No opportunities available at the moment</h2>
          </div>
        )}
      </div>

      {/* Audition Start Modal */}
      {selectedOpportunity && (
        <AuditionStartModal
          opportunity={selectedOpportunity}
          onClose={handleCloseModal}
          onStart={handleBeginAudition}
        />
      )}
    </div>
  );
};

export default Opportunities;
