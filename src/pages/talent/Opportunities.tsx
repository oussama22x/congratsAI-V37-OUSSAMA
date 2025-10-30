import { useState, useEffect } from "react";
import { OpportunityCard } from "@/components/OpportunityCard";
import { AuditionStartModal } from "@/components/AuditionStartModal";
import { AuditionQuestionScreen } from "@/components/AuditionQuestionScreen";
import { AuditionCompleteScreen } from "@/components/AuditionCompleteScreen";
import { addSubmission } from "@/lib/mockSubmissionStore";
import { useToast } from "@/hooks/use-toast";

// Backend URL - now pointing to backend folder
const BACKEND_URL = 'http://localhost:4000';

// Opportunity type
interface Opportunity {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  rate: string;
  skills: string[];
  questions: string[];
}

const Opportunities = () => {
  // State for opportunities data
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for modal
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  // State for audition flow
  const [auditionInProgress, setAuditionInProgress] = useState(false);
  const [auditionComplete, setAuditionComplete] = useState(false);
  // State for final submission data
  const [finalSubmission, setFinalSubmission] = useState<{
    questions: string[];
    answers: Blob[];
  } | null>(null);

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
        setOpportunities(data);
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

  const handleCompleteAudition = async (answers: Blob[]) => {
    if (!selectedOpportunity) return;

    try {
      // Create FormData for multipart upload
      const formData = new FormData();
      
      // Append opportunity ID
      formData.append('opportunityId', selectedOpportunity.id);
      
      // Append user ID (temporary UUID for testing - replace with actual user ID from auth)
      // Generate a valid UUID v4 for testing purposes
      formData.append('userId', '123e4567-e89b-12d3-a456-426614174000');
      
      // Append questions as JSON string
      formData.append('questions', JSON.stringify(selectedOpportunity.questions));
      
      // Append each audio blob with proper naming
      answers.forEach((blob, index) => {
        formData.append('audio_files', blob, `answer_${index}.webm`);
      });
      
      // Send POST request to backend
      const response = await fetch(`${BACKEND_URL}/api/submit-audition`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit audition');
      }
      
      const data = await response.json();
      console.log('Server response:', data);
      
      // Add submission to local store for dashboard display
      addSubmission(selectedOpportunity);
      
      // Save the final submission with questions and answers for review
      setFinalSubmission({
        questions: selectedOpportunity.questions,
        answers: answers,
      });
      
      // Show success message
      toast({
        title: "Success!",
        description: "Your audition has been submitted successfully.",
      });
      
      setAuditionInProgress(false);
      setAuditionComplete(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit audition';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error('Submission error:', err);
    }
  };

  const handleReturnToDashboard = () => {
    setAuditionComplete(false);
    setSelectedOpportunity(null);
    setFinalSubmission(null); // Clear submission data
  };

  // If audition is complete, show completion screen
  if (auditionComplete) {
    return (
      <AuditionCompleteScreen 
        onReturnToDashboard={handleReturnToDashboard} 
        submission={finalSubmission}
      />
    );
  }

  // If audition is in progress, show the question screen
  if (auditionInProgress && selectedOpportunity) {
    return (
      <AuditionQuestionScreen
        questions={selectedOpportunity.questions}
        onComplete={handleCompleteAudition}
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
