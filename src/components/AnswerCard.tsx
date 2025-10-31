import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Volume2 } from "lucide-react";

interface AnswerCardProps {
  questionText: string;
  audioUrl: string;
  questionNumber?: number;
}

export const AnswerCard = ({ 
  questionText, 
  audioUrl, 
  questionNumber 
}: AnswerCardProps) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-start gap-3 text-lg">
          <Volume2 className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
          <span>
            {questionNumber && <span className="font-bold text-primary">Q{questionNumber}: </span>}
            {questionText}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <audio 
          controls 
          src={audioUrl}
          className="w-full"
          preload="metadata"
        >
          Your browser does not support the audio element.
        </audio>
      </CardContent>
    </Card>
  );
};
