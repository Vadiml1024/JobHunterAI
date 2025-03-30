import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, CheckCircle } from "lucide-react";

export default function ResumeOptimization() {
  // These would typically come from an API call to the LLM backend
  const suggestions = [
    "Add more quantifiable achievements to your work experience",
    "Include more technical skills relevant to software engineering roles",
    "Optimize your resume for ATS systems with industry-specific keywords"
  ];

  return (
    <div className="mt-8">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Resume Optimization</h2>
      <Card>
        <CardContent className="px-4 py-5 sm:p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Lightbulb className="h-6 w-6 text-yellow-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">Improvement Suggestions</h3>
              <div className="mt-4 space-y-4">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0 mt-0.5">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-gray-700">{suggestion}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5">
                <Button variant="secondary" className="text-primary-700 bg-primary-50 hover:bg-primary-100">
                  Get Detailed Analysis
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
