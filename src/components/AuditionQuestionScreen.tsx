import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Mic, Square, Play, RotateCcw } from "lucide-react";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useCountdownTimer } from "@/hooks/useCountdownTimer";

interface AuditionQuestionScreenProps {
  questions: string[];
  onComplete: (allAnswers: Blob[]) => void;
}

export const AuditionQuestionScreen = ({ 
  questions, 
  onComplete 
}: AuditionQuestionScreenProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [allAnswers, setAllAnswers] = useState<Blob[]>([]);
  
  // Audio recording hook
  const {
    recordingStatus,
    audioBlob,
    startRecording,
    stopRecording,
    playbackAudio,
    resetRecording,
  } = useAudioRecorder();

  // Countdown timer hook (2 minutes = 120 seconds)
  const { timer, isTimeUp, startTimer, stopTimer, resetTimer } = useCountdownTimer(120);

  const currentQuestion = questions[currentQuestionIndex];
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Auto-stop recording when time is up
  useEffect(() => {
    if (isTimeUp && recordingStatus === "recording") {
      stopRecording();
      stopTimer();
    }
  }, [isTimeUp, recordingStatus]);

  const handleStartRecording = () => {
    startRecording();
    startTimer();
  };

  const handleStopRecording = () => {
    stopRecording();
    stopTimer();
  };

  const handleRecordAgain = () => {
    resetRecording();
    resetTimer();
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      // Save current answer before moving to next question
      if (audioBlob) {
        setAllAnswers([...allAnswers, audioBlob]);
      }
      
      // Move to next question and reset everything
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      resetRecording();
      resetTimer();
    } else {
      // Last question completed - save final answer and pass all answers up
      const finalAnswers = audioBlob ? [...allAnswers, audioBlob] : allAnswers;
      onComplete(finalAnswers);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardHeader className="space-y-4">
          {/* Progress Indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">
                Question {currentQuestionIndex + 1} of {questions.length}
              </CardTitle>
              <span className="text-sm text-muted-foreground font-medium">
                {Math.round(progressPercentage)}% Complete
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Question Text */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-8 text-center">
            <h2 className="text-3xl font-bold leading-relaxed">
              {currentQuestion}
            </h2>
          </div>

          {/* Timer */}
          <div className="flex justify-center">
            <div className={`rounded-lg px-8 py-4 ${
              recordingStatus === "recording" 
                ? "bg-destructive/10 border border-destructive/20" 
                : "bg-muted"
            }`}>
              <p className={`text-4xl font-mono font-bold tabular-nums ${
                recordingStatus === "recording" ? "text-destructive" : ""
              }`}>
                {timer}
              </p>
              <p className="text-xs text-muted-foreground text-center mt-1">
                {recordingStatus === "recording" ? "Time Remaining" : "Recording Time"}
              </p>
            </div>
          </div>

          {/* Recording Controls - Conditional UI based on recording status */}
          <div className="space-y-4">
            {recordingStatus === "idle" && (
              <>
                <div className="flex justify-center">
                  <Button
                    size="lg"
                    className="h-24 w-24 rounded-full"
                    onClick={handleStartRecording}
                  >
                    <Mic className="h-12 w-12" />
                  </Button>
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Click to start recording your answer (max 2 minutes)
                </p>
              </>
            )}

            {recordingStatus === "recording" && (
              <>
                <div className="flex justify-center">
                  <Button
                    size="lg"
                    variant="destructive"
                    className="h-24 w-24 rounded-full animate-pulse"
                    onClick={handleStopRecording}
                  >
                    <Square className="h-12 w-12 fill-current" />
                  </Button>
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Recording in progress... Click to stop
                </p>
              </>
            )}

            {recordingStatus === "recorded" && (
              <>
                <div className="flex justify-center">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-16 px-8"
                    onClick={playbackAudio}
                  >
                    <Play className="h-6 w-6 mr-2" />
                    Play My Answer
                  </Button>
                </div>
                <p className="text-center text-sm text-success font-medium">
                  ✓ Answer recorded successfully
                </p>
              </>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              size="lg"
              className="w-full h-14 text-lg font-semibold"
              onClick={handleNextQuestion}
              disabled={recordingStatus !== "recorded"}
            >
              {currentQuestionIndex < questions.length - 1
                ? "Submit & Next Question"
                : "Submit & Complete Audition"}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-3">
              {recordingStatus !== "recorded" 
                ? "Record your answer to continue"
                : currentQuestionIndex < questions.length - 1
                  ? `${questions.length - currentQuestionIndex - 1} question${
                      questions.length - currentQuestionIndex - 1 !== 1 ? "s" : ""
                    } remaining`
                  : "This is your final question"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
