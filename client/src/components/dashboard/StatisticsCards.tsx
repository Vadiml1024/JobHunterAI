import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, SendHorizonal, Phone, Flame } from "lucide-react";
import { Application } from "@/types";

export default function StatisticsCards() {
  const { data: applications } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });
  
  // Calculate statistics based on applications
  const jobsViewed = 24; // This would normally come from analytics
  const applicationsCount = applications?.length || 0;
  
  // Count interviews (applications with status === 'interview')
  const interviewsCount = applications?.filter(app => app.status === 'interview').length || 0;
  
  // Match rate would be calculated based on resume analysis and job matching
  const matchRate = 89; // This would be calculated from job matching data
  
  const statistics = [
    {
      title: "Jobs Viewed",
      value: jobsViewed,
      change: "+12%",
      icon: <Eye className="text-primary-600" />,
      bgColor: "bg-primary-100"
    },
    {
      title: "Applications Sent",
      value: applicationsCount,
      change: "+3%",
      icon: <SendHorizonal className="text-blue-600" />,
      bgColor: "bg-blue-100"
    },
    {
      title: "Interviews",
      value: interviewsCount,
      icon: <Phone className="text-green-600" />,
      bgColor: "bg-green-100"
    },
    {
      title: "Match Rate",
      value: `${matchRate}%`,
      icon: <Flame className="text-red-600" />,
      bgColor: "bg-red-100"
    }
  ];
  
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      {statistics.map((stat, index) => (
        <Card key={index} className="border-none">
          <CardContent className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${stat.bgColor} rounded-md p-3`}>
                {stat.icon}
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{stat.title}</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
                    {stat.change && (
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-500">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        <span className="sr-only">Increased by</span>
                        {stat.change}
                      </div>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
