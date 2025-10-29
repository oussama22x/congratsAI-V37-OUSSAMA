import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ArrowLeft, Play } from "lucide-react";
import { motion } from "framer-motion";

interface AuditionCompleteScreenProps {
  onReturnToDashboard: () => void;
  submission?: {
    questions: string[];
    answers: Blob[];
  } | null;
}

export const AuditionCompleteScreen = ({ onReturnToDashboard, submission }: AuditionCompleteScreenProps) => {
  // Handler for playing audio answers
  const handlePlayAnswer = (answerBlob: Blob) => {
    // Create a URL for the blob
    const audioUrl = URL.createObjectURL(answerBlob);
    
    // Create and play audio
    const audio = new Audio(audioUrl);
    audio.play();
    
    // Clean up the URL after playback
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
    };
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center space-y-4 pb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex justify-center"
            >
              <div className="h-24 w-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" />
              </div>
            </motion.div>
            <CardTitle className="text-4xl font-bold">
              Audition Complete! 🎉
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6 text-center">
            <div className="space-y-3">
              <p className="text-lg text-muted-foreground">
                Thank you for completing your audition!
              </p>
              <p className="text-sm text-muted-foreground">
                Your responses have been successfully submitted and will be reviewed by our team. 
                We'll notify you once the review is complete.
              </p>
            </div>

            {/* Review Section */}
            {submission && submission.questions.length > 0 && (
              <div className="rounded-lg border bg-muted/50 p-6 space-y-4">
                <h3 className="font-semibold text-lg text-left">Review Your Answers</h3>
                <div className="space-y-3">
                  {submission.questions.map((question, index) => (
                    <div 
                      key={index} 
                      className="flex items-start justify-between gap-4 p-4 rounded-lg bg-background border text-left"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-primary">Question {index + 1}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{question}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={() => handlePlayAnswer(submission.answers[index])}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Play My Answer
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-lg border bg-muted/50 p-6 space-y-3">
              <h3 className="font-semibold text-lg">What's Next?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground text-left">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Our team will review your audition within 2-3 business days</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>You'll receive an email notification with the results</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Check your dashboard for updates on your application status</span>
                </li>
              </ul>
            </div>

            <div className="pt-4">
              <Button
                size="lg"
                className="w-full h-14 text-lg font-semibold"
                onClick={onReturnToDashboard}
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
