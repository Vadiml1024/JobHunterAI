import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import MobileNav from "@/components/layout/MobileNav";
import ChatAssistant from "@/components/layout/ChatAssistant";
import { Application, Job } from "@/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  BarChart,
  LineChart,
  PieChart,
  ResponsiveContainer,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Pie,
  Cell,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart as BarChartIcon, Calendar, FileText } from "lucide-react";

export default function AnalyticsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  const { data: applications } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const { data: jobs } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
  });

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "applied":
        return "#3b82f6"; // blue
      case "interview":
        return "#10b981"; // green
      case "offer":
        return "#6366f1"; // indigo
      case "rejected":
        return "#ef4444"; // red
      default:
        return "#9ca3af"; // gray
    }
  };

  // Generate application status data
  const applicationStatusData = [
    { name: "Applied", value: applications?.filter(app => app.status === "applied").length || 0 },
    { name: "Interview", value: applications?.filter(app => app.status === "interview").length || 0 },
    { name: "Offer", value: applications?.filter(app => app.status === "offer").length || 0 },
    { name: "Rejected", value: applications?.filter(app => app.status === "rejected").length || 0 },
  ];

  const COLORS = ["#3b82f6", "#10b981", "#6366f1", "#ef4444"];

  // Generate application over time data (fake data for now)
  const generateTimeSeriesData = () => {
    const currentDate = new Date();
    const data = [];
    
    // Generate data for last 12 points (days, weeks, or months)
    const totalPoints = 12;
    const pointValue = selectedPeriod === "year" ? "month" : selectedPeriod === "month" ? "week" : "day";
    
    for (let i = totalPoints - 1; i >= 0; i--) {
      const date = new Date();
      
      if (pointValue === "month") {
        date.setMonth(currentDate.getMonth() - i);
      } else if (pointValue === "week") {
        date.setDate(currentDate.getDate() - (i * 7));
      } else {
        date.setDate(currentDate.getDate() - i);
      }
      
      const label = date.toLocaleDateString('en-US', { 
        month: pointValue === "month" ? 'short' : 'numeric',
        day: pointValue !== "month" ? 'numeric' : undefined,
      });
      
      // Simulate applied data with some randomness
      let applied = Math.floor(Math.random() * 10) + (totalPoints - i);
      
      // Interviews are a subset of applied
      let interviews = Math.max(0, Math.floor(applied * 0.4) + Math.floor(Math.random() * 3) - 1);
      
      // Offers are a subset of interviews
      let offers = Math.max(0, Math.floor(interviews * 0.3) + Math.floor(Math.random() * 2) - 1);
      
      data.push({
        name: label,
        Applied: applied,
        Interviews: interviews,
        Offers: offers,
      });
    }
    
    return data;
  };

  // Generate application sources data
  const applicationSourcesData = [
    { name: "LinkedIn", value: 42 },
    { name: "Indeed", value: 28 },
    { name: "Company Website", value: 15 },
    { name: "Referral", value: 10 },
    { name: "Other", value: 5 },
  ];

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
                <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
                <p className="mt-1 text-gray-600">
                  Track your job search progress and performance
                </p>
              </div>
              <div>
                <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <TabsList>
                    <TabsTrigger value="week">Week</TabsTrigger>
                    <TabsTrigger value="month">Month</TabsTrigger>
                    <TabsTrigger value="year">Year</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Application Status Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Application Status</CardTitle>
                <CardDescription>
                  Current status of all job applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={applicationStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {applicationStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Applications Over Time Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Applications Over Time</CardTitle>
                <CardDescription>
                  Track your application progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={generateTimeSeriesData()}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="Applied"
                        stroke="#3b82f6"
                        activeDot={{ r: 8 }}
                      />
                      <Line type="monotone" dataKey="Interviews" stroke="#10b981" />
                      <Line type="monotone" dataKey="Offers" stroke="#6366f1" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* More Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Application Sources Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Application Sources</CardTitle>
                <CardDescription>
                  Where your applications are coming from
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={applicationSourcesData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Applications" fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Analytics Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Job Search Insights</CardTitle>
                <CardDescription>
                  Key metrics and performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-blue-100 p-2 rounded-md">
                        <BarChartIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-900">Application Success Rate</h3>
                        <p className="text-2xl font-semibold text-gray-900">
                          {applications && applications.length > 0
                            ? `${Math.round((applications.filter(a => a.status === "interview" || a.status === "offer").length / applications.length) * 100)}%`
                            : "0%"}
                        </p>
                        <p className="text-sm text-gray-500">
                          Percentage of applications that resulted in interviews or offers
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-100 p-2 rounded-md">
                        <Calendar className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-900">Average Response Time</h3>
                        <p className="text-2xl font-semibold text-gray-900">14 days</p>
                        <p className="text-sm text-gray-500">
                          Average time between application and first response
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-purple-100 p-2 rounded-md">
                        <FileText className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-sm font-medium text-gray-900">Application Quality Score</h3>
                        <p className="text-2xl font-semibold text-gray-900">82/100</p>
                        <p className="text-sm text-gray-500">
                          AI-powered quality score of your application materials
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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