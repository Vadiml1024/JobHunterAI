import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import MobileNav from "@/components/layout/MobileNav";
import ChatAssistant from "@/components/layout/ChatAssistant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Upload, Settings, Bell, User, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Profile schema
const profileSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
  location: z.string().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  language: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [llmProviders, setLlmProviders] = useState<{
    current: string;
    available: string[];
    defaultProvider: string;
    providers?: {
      openai?: {
        models: string[];
        currentModel: string;
      };
      gemini?: {
        models: string[];
        currentModel: string;
      };
    };
  }>({ current: "", available: [], defaultProvider: "" });
  const [llmLoading, setLlmLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load LLM provider info
  useEffect(() => {
    async function loadLlmProviders() {
      if (!user) return;
      
      try {
        const response = await fetch('/api/llm-providers', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setLlmProviders(data);
          console.log("LLM providers loaded:", data);
        }
      } catch (error) {
        console.error("Failed to load LLM providers:", error);
      }
    }
    
    loadLlmProviders();
  }, [user]);

  // Set LLM provider 
  const handleProviderChange = async (provider: string) => {
    if (llmLoading || provider === llmProviders.current) return;
    
    setLlmLoading(true);
    try {
      const response = await fetch('/api/llm-providers/set', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ provider }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setLlmProviders(prev => ({ ...prev, current: data.provider }));
        toast({
          title: "LLM Provider Updated",
          description: `Successfully switched to ${data.provider}`,
        });
        
        // Reload provider info after switching to get the latest provider data
        loadLlmProviders();
      } else {
        throw new Error(`Failed to update provider: ${response.statusText}`);
      }
    } catch (error) {
      toast({
        title: "Failed to update LLM Provider",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLlmLoading(false);
    }
  };
  
  // Set LLM model for a provider
  const handleModelChange = async (provider: string, model: string) => {
    if (llmLoading) return;
    
    // Don't make API call if the model is already selected
    const currentModel = llmProviders.providers?.[provider as keyof typeof llmProviders.providers]?.currentModel;
    if (currentModel === model) return;
    
    setLlmLoading(true);
    try {
      const response = await fetch('/api/llm-providers/model', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ provider, model }),
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update the providers state with the new model
        setLlmProviders(prev => {
          if (!prev.providers) return prev;
          
          return {
            ...prev,
            providers: {
              ...prev.providers,
              [provider]: {
                ...prev.providers[provider as keyof typeof prev.providers],
                currentModel: model
              }
            }
          };
        });
        
        toast({
          title: "AI Model Updated",
          description: `Successfully set ${provider} model to ${model}`,
        });
      } else {
        throw new Error(`Failed to update model: ${response.statusText}`);
      }
    } catch (error) {
      toast({
        title: "Failed to update AI Model",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLlmLoading(false);
    }
  };
  
  // Function to load LLM providers
  const loadLlmProviders = async () => {
    if (!user) return;
    
    try {
      const response = await fetch('/api/llm-providers', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setLlmProviders(data);
        console.log("LLM providers loaded:", data);
      }
    } catch (error) {
      console.error("Failed to load LLM providers:", error);
    }
  };

  // Profile form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      location: "",
      bio: "",
      website: "",
      language: "en",
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("PUT", `/api/user/${user?.id}`, data);
      return res.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

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
          {/* Profile Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
            <p className="mt-1 text-gray-600">Manage your account settings and preferences</p>
          </div>

          {/* Profile Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
              <TabsTrigger value="profile" className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Preferences
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
            </TabsList>
            
            {/* Profile Tab Content */}
            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information and how others see you on the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-8">
                    {/* Avatar */}
                    <div className="flex flex-col items-center space-y-4">
                      <Avatar className="h-32 w-32">
                        <AvatarImage src={user?.avatar} alt={user?.name || user?.username} />
                        <AvatarFallback className="text-2xl bg-primary-100 text-primary-800">
                          {user?.name?.charAt(0) || user?.username?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <Button variant="outline" className="flex items-center">
                        <Upload className="h-4 w-4 mr-2" />
                        Change Photo
                      </Button>
                    </div>

                    {/* Profile Form */}
                    <div className="flex-1">
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="John Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                  <Input placeholder="john.doe@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Location</FormLabel>
                                <FormControl>
                                  <Input placeholder="San Francisco, CA" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="bio"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Bio</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Tell us a bit about yourself..."
                                    className="resize-none"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>
                                  Brief description for your profile. URLs are hyperlinked.
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="flex items-center justify-end">
                            <Button 
                              type="submit"
                              disabled={updateProfileMutation.isPending}
                            >
                              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>
                    Details about your account and subscription
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Username</span>
                      <span className="text-sm text-gray-900">{user?.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Account Type</span>
                      <span className="text-sm text-gray-900">{user?.plan === "premium" ? "Premium" : "Free"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-500">Member Since</span>
                      <span className="text-sm text-gray-900">August 2023</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  {user?.plan !== "premium" && (
                    <Button variant="outline" className="w-full">
                      Upgrade to Premium
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </TabsContent>
            
            {/* Preferences Tab Content */}
            <TabsContent value="preferences" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>
                    Manage how you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Bell className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Job Recommendations</p>
                          <p className="text-xs text-gray-500">Get notified about new jobs that match your profile</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Bell className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Application Updates</p>
                          <p className="text-xs text-gray-500">Get notified when your application status changes</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Bell className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Marketing Updates</p>
                          <p className="text-xs text-gray-500">Receive news and updates about JobAI</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Language & Region</CardTitle>
                  <CardDescription>
                    Set your preferred language and job search region
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                          <FormField
                            control={form.control}
                            name="language"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Preferred Language</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a language" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="fr">French</SelectItem>
                                    <SelectItem value="de">German</SelectItem>
                                    <SelectItem value="es">Spanish</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex justify-end mt-4">
                          <Button type="submit">Save Preferences</Button>
                        </div>
                      </form>
                    </Form>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>AI Provider Settings</CardTitle>
                  <CardDescription>
                    Choose which AI model powers your job search experience
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-sm font-medium">Current AI Provider</h4>
                          <p className="text-xs text-gray-500">
                            {llmProviders.current ? (
                              <>Using <span className="font-medium">{llmProviders.current}</span></>
                            ) : (
                              "Loading..."
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid gap-2">
                        <label className="text-sm font-medium">Select AI Provider</label>
                        <div className="flex flex-col sm:flex-row gap-3">
                          {llmProviders.available.map((provider) => (
                            <Button 
                              key={provider}
                              onClick={() => handleProviderChange(provider)}
                              variant={llmProviders.current === provider ? "default" : "outline"}
                              disabled={llmLoading || llmProviders.current === provider}
                              className="flex-1 capitalize"
                            >
                              {provider}
                            </Button>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Select your preferred AI provider. This will affect all AI-powered features such as
                          resume analysis, job matching, cover letter generation, and the chat assistant.
                        </p>
                      </div>
                      
                      {/* Model Selection */}
                      {llmProviders.current && llmProviders.providers && (
                        <div className="grid gap-2 mt-4">
                          <label className="text-sm font-medium">Select AI Model</label>
                          <div className="flex flex-col gap-3">
                            {llmProviders.providers[llmProviders.current as keyof typeof llmProviders.providers]?.models.map((model) => (
                              <Button 
                                key={model}
                                onClick={() => handleModelChange(llmProviders.current, model)}
                                variant={
                                  llmProviders.providers?.[llmProviders.current as keyof typeof llmProviders.providers]?.currentModel === model 
                                    ? "default" 
                                    : "outline"
                                }
                                disabled={
                                  llmLoading || 
                                  llmProviders.providers?.[llmProviders.current as keyof typeof llmProviders.providers]?.currentModel === model
                                }
                                className="w-full text-left justify-start"
                              >
                                {model}
                              </Button>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Select which model to use with the {llmProviders.current} provider. 
                            Different models have different capabilities and performance characteristics.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Security Tab Content */}
            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Password</CardTitle>
                  <CardDescription>
                    Change your password
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <form className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input id="current-password" type="password" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input id="new-password" type="password" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <Input id="confirm-password" type="password" />
                      </div>
                      <div className="flex justify-end mt-4">
                        <Button type="submit">Update Password</Button>
                      </div>
                    </form>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Account Security</CardTitle>
                  <CardDescription>
                    Manage your account security settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
                        <p className="text-xs text-gray-500">Add an extra layer of security to your account</p>
                      </div>
                      <Button variant="outline">Enable</Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Active Sessions</p>
                        <p className="text-xs text-gray-500">Manage your active login sessions</p>
                      </div>
                      <Button variant="outline">View</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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

// Helper Component
function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-gray-700">
      {children}
    </label>
  );
}
