import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, DollarSign } from "lucide-react";

interface OpportunityCardProps {
  title: string;
  company: string;
  location: string;
  type: string;
  rate: string;
  skills: string[];
  onStartAudition: () => void;
}

export const OpportunityCard = ({ 
  title, 
  company, 
  location, 
  type, 
  rate, 
  skills,
  onStartAudition
}: OpportunityCardProps) => {
  return (
    <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col h-full">
      <CardContent className="pt-6 flex flex-col h-full">
        {/* Header */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-1">{company}</p>
          <h3 className="text-2xl font-bold tracking-tight">{title}</h3>
        </div>

        {/* Info Bar */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary" className="gap-1 text-xs">
            <MapPin className="h-3 w-3" />
            {location}
          </Badge>
          <Badge variant="secondary" className="gap-1 text-xs">
            <Briefcase className="h-3 w-3" />
            {type}
          </Badge>
          <Badge variant="secondary" className="gap-1 text-xs">
            <DollarSign className="h-3 w-3" />
            {rate}
          </Badge>
        </div>

        {/* Skills List */}
        <div className="mb-6 flex-grow">
          <p className="text-sm font-medium mb-2 text-muted-foreground">Required Skills</p>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-800 rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Call-to-Action */}
        <Button className="w-full mt-auto" onClick={onStartAudition}>
          Start Audition
        </Button>
      </CardContent>
    </Card>
  );
};
