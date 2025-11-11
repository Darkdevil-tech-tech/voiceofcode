import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, MessageSquare, Filter, FileText, Clock, CheckCircle, AlertCircle, Paperclip, Download } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Complaint = {
  id: string;
  title: string;
  category: string;
  description: string;
  status: "Pending" | "Under Review" | "Resolved";
  admin_remarks: string | null;
  file_url: string | null;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    email: string;
  } | null;
};

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [updating, setUpdating] = useState(false);
  
  const [newStatus, setNewStatus] = useState<"Pending" | "Under Review" | "Resolved">("Pending");
  const [adminRemarks, setAdminRemarks] = useState("");

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    filterComplaints();
  }, [complaints, statusFilter, categoryFilter]);

  const fetchComplaints = async () => {
    const { data: complaintsData, error: complaintsError } = await supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false });

    if (complaintsError) {
      toast.error("Failed to load complaints");
      setLoading(false);
      return;
    }

    // Fetch profile data separately
    const userIds = [...new Set(complaintsData.map(c => c.user_id))];
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);

    if (profilesError) {
      toast.error("Failed to load user profiles");
      setLoading(false);
      return;
    }

    // Merge complaints with profiles
    const complaintsWithProfiles = complaintsData.map(complaint => ({
      ...complaint,
      profiles: profilesData?.find(p => p.id === complaint.user_id) || null,
    }));

    setComplaints(complaintsWithProfiles as Complaint[]);
    setLoading(false);
  };

  const filterComplaints = () => {
    let filtered = [...complaints];

    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((c) => c.category === categoryFilter);
    }

    setFilteredComplaints(filtered);
  };

  const handleUpdateComplaint = async () => {
    if (!selectedComplaint || !newStatus) return;

    setUpdating(true);

    const { error } = await supabase
      .from("complaints")
      .update({
        status: newStatus,
        admin_remarks: adminRemarks || null,
      })
      .eq("id", selectedComplaint.id);

    if (error) {
      toast.error("Failed to update complaint");
    } else {
      toast.success("Complaint updated successfully!");
      setSelectedComplaint(null);
      setNewStatus("Pending");
      setAdminRemarks("");
      fetchComplaints();
    }

    setUpdating(false);
  };

  const openComplaintDialog = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setNewStatus(complaint.status);
    setAdminRemarks(complaint.admin_remarks || "");
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
      <header className="border-b bg-primary shadow-lg">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">VoiceOfCode</h1>
                <p className="text-sm text-white/80">Admin Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">Administrator</p>
                <p className="text-xs text-white/70">{user?.email}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={signOut}>
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
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Complaints</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Under Review</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{stats.underReview}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats.resolved}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <CardTitle>Filters</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Under Review">Under Review</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Academic">Academic</SelectItem>
                    <SelectItem value="Behavior">Behavior</SelectItem>
                    <SelectItem value="Facility">Facility</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Complaints List */}
        <Card>
          <CardHeader>
            <CardTitle>All Complaints</CardTitle>
            <CardDescription>Manage and respond to student complaints</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : filteredComplaints.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium text-muted-foreground">No complaints found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredComplaints.map((complaint) => (
                  <Card
                    key={complaint.id}
                    className="border-l-4 cursor-pointer transition-shadow hover:shadow-md"
                    style={{
                      borderLeftColor:
                        complaint.status === "Resolved"
                          ? "#22c55e"
                          : complaint.status === "Under Review"
                          ? "#3b82f6"
                          : "#eab308",
                    }}
                    onClick={() => openComplaintDialog(complaint)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{complaint.title}</CardTitle>
                          <CardDescription className="mt-1">
                            By {complaint.profiles?.full_name || "Unknown"} ({complaint.profiles?.email || "N/A"}) •{" "}
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
                      <p className="text-sm text-muted-foreground">{complaint.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Update Dialog */}
      <Dialog open={selectedComplaint !== null} onOpenChange={(open) => !open && setSelectedComplaint(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Complaint</DialogTitle>
            <DialogDescription>Change status and add remarks for this complaint</DialogDescription>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <h4 className="mb-2 font-semibold">{selectedComplaint.title}</h4>
                <p className="mb-2 text-sm text-muted-foreground">{selectedComplaint.description}</p>
                {selectedComplaint.file_url && (
                  <div className="mb-2 rounded-lg bg-background border p-3">
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Student Attachment</span>
                    </div>
                    <a
                      href={selectedComplaint.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Download className="h-3 w-3" />
                      View/Download File
                    </a>
                  </div>
                )}
                <div className="flex gap-2">
                  <Badge variant="secondary">{selectedComplaint.category}</Badge>
                  <Badge variant="outline">{selectedComplaint.profiles?.full_name || "Unknown"}</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={(value) => setNewStatus(value as "Pending" | "Under Review" | "Resolved")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Under Review">Under Review</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Admin Remarks</Label>
                <Textarea
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder="Add your response or remarks..."
                  rows={6}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedComplaint(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateComplaint} disabled={updating} className="bg-accent hover:bg-accent-light">
                  {updating ? "Updating..." : "Update Complaint"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
