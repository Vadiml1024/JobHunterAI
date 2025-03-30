import { useAuth } from "@/hooks/use-auth";

export default function DashboardHeader() {
  const { user } = useAuth();
  
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold text-gray-900">Welcome back, {user?.name || user?.username}</h1>
      <p className="mt-1 text-gray-600">Here's what's happening with your job search</p>
    </div>
  );
}
