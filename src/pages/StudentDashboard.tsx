import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Plus, MessageSquare, FileText, Clock, CheckCircle, AlertCircle, Upload, Paperclip, Download } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";

const complaintSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(200),
  category: z.enum(["Technical", "Academic", "Behavior", "Facility", "Other"]),
  description: z.string().trim().min(20, "Description must be at least 20 characters").max(2000),
});

type Complaint = {
  id: string;
  title: string;
  category: string;
  description: string;
  status: string;
  admin_remarks: string | null;
  file_url: string | null;
  created_at: string;
  updated_at: string;
};

const StudentDashboard = () => {
  const { user, signOut } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [profileName, setProfileName] = useState("");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchComplaints();
  }, []);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();
    
    if (data) {
      setProfileName(data.full_name);
    }
  };

  const fetchComplaints = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load complaints");
      return;
    }

    setComplaints(data || []);
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size (10MB max)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!file || !user) return null;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('complaint-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('complaint-files')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("File upload error:", error);
      toast.error("Failed to upload file");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const validated = complaintSchema.parse({ title, category, description });

      // Upload file if present
      let fileUrl = null;
      if (file) {
        fileUrl = await uploadFile();
        if (!fileUrl) {
          setSubmitting(false);
          return;
        }
      }

      const { error } = await supabase.from("complaints").insert({
        user_id: user!.id,
        title: validated.title,
        category: validated.category,
        description: validated.description,
        file_url: fileUrl,
      });

      if (error) throw error;

      toast.success("Complaint submitted successfully!");
      setTitle("");
      setCategory("");
      setDescription("");
      setFile(null);
      setOpen(false);
      fetchComplaints();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Failed to submit complaint");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <Clock className="h-4 w-4" />;
      case "Under Review":
        return <AlertCircle className="h-4 w-4" />;
      case "Resolved":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-500/20";
      case "Under Review":
        return "bg-blue-500/10 text-blue-700 border-blue-500/20";
      case "Resolved":
        return "bg-green-500/10 text-green-700 border-green-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-500/20";
    }
  };

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === "Pending").length,
    underReview: complaints.filter((c) => c.status === "Under Review").length,
    resolved: complaints.filter((c) => c.status === "Resolved").length,
  };

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary">VoiceOfCode</h1>
                <p className="text-sm text-muted-foreground">Student Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium">{profileName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Complaints</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Under Review</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{stats.underReview}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
            </CardContent>
          </Card>
        </div>

        {/* Complaints Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>My Complaints</CardTitle>
                <CardDescription>View and manage your submitted complaints</CardDescription>
              </div>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-accent hover:bg-accent-light">
                    <Plus className="mr-2 h-4 w-4" />
                    New Complaint
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Submit New Complaint</DialogTitle>
                    <DialogDescription>Fill out the form below to submit your complaint</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Brief title of your complaint"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select value={category} onValueChange={setCategory} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Technical">Technical</SelectItem>
                          <SelectItem value="Academic">Academic</SelectItem>
                          <SelectItem value="Behavior">Behavior</SelectItem>
                          <SelectItem value="Facility">Facility</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Provide detailed information about your complaint"
                        rows={6}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="file">Attachment (Optional)</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="file"
                          type="file"
                          onChange={handleFileChange}
                          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,.doc,.docx"
                          className="cursor-pointer"
                        />
                        {file && (
                          <Badge variant="secondary" className="shrink-0">
                            <Paperclip className="mr-1 h-3 w-3" />
                            {file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Max file size: 10MB. Supported: Images, PDF, Word documents
                      </p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting || uploading} className="bg-accent hover:bg-accent-light">
                        {uploading ? "Uploading..." : submitting ? "Submitting..." : "Submit Complaint"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : complaints.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium text-muted-foreground">No complaints yet</p>
                <p className="text-sm text-muted-foreground">Click "New Complaint" to submit your first complaint</p>
              </div>
            ) : (
              <div className="space-y-4">
                {complaints.map((complaint) => (
                  <Card key={complaint.id} className="border-l-4" style={{ borderLeftColor: complaint.status === "Resolved" ? "#22c55e" : complaint.status === "Under Review" ? "#3b82f6" : "#eab308" }}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{complaint.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {new Date(complaint.created_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Badge variant="outline" className={getStatusColor(complaint.status)}>
                            {getStatusIcon(complaint.status)}
                            <span className="ml-1">{complaint.status}</span>
                          </Badge>
                          <Badge variant="secondary">{complaint.category}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4 text-sm text-muted-foreground">{complaint.description}</p>
                      {complaint.file_url && (
                        <div className="mb-4 rounded-lg bg-secondary border p-3">
                          <div className="flex items-center gap-2">
                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Attachment</span>
                          </div>
                          <a
                            href={complaint.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 flex items-center gap-2 text-sm text-primary hover:underline"
                          >
                            <Download className="h-3 w-3" />
                            View/Download File
                          </a>
                        </div>
                      )}
                      {complaint.admin_remarks && (
                        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                          <p className="mb-1 text-sm font-semibold text-blue-900">Admin Response:</p>
                          <p className="text-sm text-blue-800">{complaint.admin_remarks}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StudentDashboard;
