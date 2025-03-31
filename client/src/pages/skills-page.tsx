import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import MobileNav from "@/components/layout/MobileNav";
import ChatAssistant from "@/components/layout/ChatAssistant";
import { Resume } from "@/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, BarChart2 } from "lucide-react";

export default function SkillsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const { data: resumes, isLoading } = useQuery<Resume[]>({
    queryKey: ["/api/resumes"],
  });

  // Extract all unique skills from resumes
  const allSkills = new Set<string>();
  if (resumes) {
    resumes.forEach(resume => {
      if (resume.skills) {
        resume.skills.forEach(skill => allSkills.add(skill));
      }
    });
  }

  // Calculate skill stats
  const skillStats = Array.from(allSkills).map(skill => {
    // Count appearances in resumes
    const resumeCount = resumes?.filter(r => r.skills?.includes(skill)).length || 0;
    
    // Assume a market demand score (could come from real API)
    const marketDemand = Math.floor(Math.random() * 100) + 1;
    
    return {
      name: skill,
      resumeCount,
      marketDemand,
      growthRate: Math.floor(Math.random() * 30) - 5 // Random growth rate between -5% and +25%
    };
  }).sort((a, b) => b.marketDemand - a.marketDemand);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <TopBar
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          chatOpen={chatOpen}
          setChatOpen={setChatOpen}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Skill Analysis</h1>
                <p className="mt-1 text-gray-600">
                  Analyze your skills and compare them with market demand
                </p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : !resumes?.length || !skillStats.length ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-8">
                <div className="text-center">
                  <BarChart2 className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No skills to analyze</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Add a resume and analyze it to see your skills analysis
                  </p>
                  <Button className="mt-6" onClick={() => window.location.href = "/resumes"}>
                    Go to Resumes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Top Skills Overview */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Your Top Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {skillStats.slice(0, 6).map((skill, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium text-gray-900">{skill.name}</h3>
                          <Badge 
                            variant={skill.marketDemand > 70 ? "default" : "secondary"}
                            className={skill.marketDemand > 70 ? "bg-green-100 text-green-800" : ""}
                          >
                            {skill.marketDemand > 70 ? "High Demand" : "Medium Demand"}
                          </Badge>
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-sm text-gray-500 mb-1">
                            <span>Market Demand</span>
                            <span>{skill.marketDemand}%</span>
                          </div>
                          <Progress value={skill.marketDemand} className="h-2" />
                        </div>
                        <div className="mt-3 text-sm">
                          <span className={`font-medium ${skill.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {skill.growthRate > 0 ? `+${skill.growthRate}%` : `${skill.growthRate}%`}
                          </span>
                          <span className="text-gray-500 ml-1">growth this year</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Skills Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Skills Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Skill
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Present in Resumes
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Market Demand
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Growth Rate
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Recommendation
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {skillStats.map((skill, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {skill.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {skill.resumeCount} of {resumes?.length || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center">
                                <Progress value={skill.marketDemand} className="h-2 w-24 mr-2" />
                                <span>{skill.marketDemand}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`${skill.growthRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {skill.growthRate > 0 ? `+${skill.growthRate}%` : `${skill.growthRate}%`}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {skill.marketDemand > 70 ? (
                                <span className="text-green-600 flex items-center">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Highlight
                                </span>
                              ) : skill.marketDemand < 30 ? (
                                <span className="text-red-600">Consider alternatives</span>
                              ) : (
                                <span>Maintain</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </main>

        {/* Chat Assistant */}
        <ChatAssistant
          open={chatOpen}
          onClose={() => setChatOpen(false)}
        />

        {/* Mobile Navigation */}
        <MobileNav />
      </div>
    </div>
  );
}