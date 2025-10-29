import { useState } from "react";
import { OpportunityCard } from "@/components/OpportunityCard";
import { AuditionStartModal } from "@/components/AuditionStartModal";
import { AuditionQuestionScreen } from "@/components/AuditionQuestionScreen";
import { AuditionCompleteScreen } from "@/components/AuditionCompleteScreen";
import { addSubmission } from "@/lib/mockSubmissionStore";

const Opportunities = () => {
  // State for modal
  const [selectedOpportunity, setSelectedOpportunity] = useState<typeof DUMMY_OPPORTUNITIES[0] | null>(null);
  // State for audition flow
  const [auditionInProgress, setAuditionInProgress] = useState(false);
  const [auditionComplete, setAuditionComplete] = useState(false);
  // State for final submission data
  const [finalSubmission, setFinalSubmission] = useState<{
    questions: string[];
    answers: Blob[];
  } | null>(null);

  // Mock data for opportunities
  const DUMMY_OPPORTUNITIES = [
    {
      id: 1,
      title: "Backend Engineer",
      company: "Vetted AI",
      location: "Remote (Global)",
      type: "Full-time",
      rate: "$80 - $100 /hr",
      skills: ["Node.js", "TypeScript", "Supabase", "PostgreSQL"],
      questions: [
        "Tell us about a backend system you designed and built from scratch.",
        "Describe a time when you optimized database performance. What was your approach?",
        "Why are you interested in working with our tech stack at Vetted AI?"
      ],
    },
    {
      id: 2,
      title: "Full Stack Developer",
      company: "TechCorp Solutions",
      location: "Nairobi, Kenya",
      type: "Contract",
      rate: "$60 - $85 /hr",
      skills: ["React", "Python", "AWS", "Docker"],
      questions: [
        "Tell us about a project you are proud of.",
        "What was a major challenge you faced in full-stack development and how did you solve it?",
        "How do you approach building scalable applications?"
      ],
    },
    {
      id: 3,
      title: "Senior Frontend Engineer",
      company: "Digital Innovations",
      location: "Remote (Africa)",
      type: "Full-time",
      rate: "$70 - $95 /hr",
      skills: ["React", "TypeScript", "Next.js", "Tailwind CSS"],
      questions: [
        "Describe your experience with building responsive and accessible user interfaces.",
        "Tell us about a time when you improved the performance of a React application.",
        "Why are you interested in this role at Digital Innovations?"
      ],
    },
  ];

  // Handler functions
  const handleStartAudition = (opportunity: typeof DUMMY_OPPORTUNITIES[0]) => {
    setSelectedOpportunity(opportunity);
  };

  const handleCloseModal = () => {
    setSelectedOpportunity(null);
  };

  const handleBeginAudition = () => {
    setAuditionInProgress(true);
  };

  const handleCompleteAudition = (answers: Blob[]) => {
    // Add submission to store
    if (selectedOpportunity) {
      addSubmission(selectedOpportunity);
      
      // Save the final submission with questions and answers for review
      setFinalSubmission({
        questions: selectedOpportunity.questions,
        answers: answers,
      });
    }
    setAuditionInProgress(false);
    setAuditionComplete(true);
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
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {DUMMY_OPPORTUNITIES.map((opportunity) => (
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
