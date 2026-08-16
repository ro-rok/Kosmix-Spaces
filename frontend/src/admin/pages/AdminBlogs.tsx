import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  MoreVertical,
  FileText,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { toast } from "sonner";

type BlogStatus = "draft" | "pending_review" | "published" | "archived";

interface Blog {
  blogId: string;
  title: string;
  excerpt: string;
  slug: string;
  status: BlogStatus;
  categories: string[];
  tags: string[];
  featuredImage?: { url: string; altText: string };
  publishedAt?: string;
  createdAt: string;
  wordCount: number;
  readingTime?: number;
  associatedWorkspaces: { workspaceId: string; displayName: string }[];
}

const STATUS_BADGE: Record<BlogStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  pending_review: { label: "Pending Review", className: "bg-blue-50 text-blue-700 border-blue-200" },
  published: { label: "Published", className: "bg-green-50 text-green-700 border-green-200" },
  archived: { label: "Archived", className: "bg-gray-50 text-gray-700 border-gray-200" },
};

export function AdminBlogs() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "blogs", { page, search, statusFilter }],
    queryFn: () =>
      api.admin.getBlogs({ page, limit: 20, search: search || undefined, status_filter: statusFilter || undefined }),
    staleTime: 30_000,
  });

  const archiveMutation = useMutation({
    mutationFn: (blogId: string) => api.admin.deleteBlog(blogId),
    onSuccess: () => {
      toast.success("Blog archived successfully");
      queryClient.invalidateQueries({ queryKey: ["admin", "blogs"] });
    },
    onError: () => toast.error("Failed to archive blog"),
  });

  const blogs: Blog[] = data?.blogs ?? [];
  const totalBlogs = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const formatDate = (d?: string) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })
      : "—";

  const statusCounts = blogs.reduce(
    (acc, b) => { acc[b.status] = (acc[b.status] ?? 0) + 1; return acc; },
    {} as Record<BlogStatus, number>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blog Management</h1>
          <p className="text-muted-foreground">
            Write and manage blog posts for SEO and content marketing
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/blogs/new">
            <Plus className="h-4 w-4 mr-2" />
            New Blog Post
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {(["published", "draft", "pending_review", "archived"] as BlogStatus[]).map((s) => {
          const { label, className } = STATUS_BADGE[s];
          return (
            <Card key={s}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statusCounts[s] ?? 0}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters + Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Blog Posts</CardTitle>
          <CardDescription>{totalBlogs} total</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <form
              className="flex flex-1 gap-2"
              onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(searchInput); }}
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, tags..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" variant="secondary">Search</Button>
            </form>
            <Select
              value={statusFilter}
              onValueChange={(v) => { setStatusFilter(v === "all" ? "" : v); setPage(1); }}
            >
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending_review">Pending Review</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No blog posts found. Create your first one!</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[45%]">Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Workspaces</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blogs.map((blog) => {
                    const { label, className } = STATUS_BADGE[blog.status] ?? STATUS_BADGE.draft;
                    return (
                      <TableRow key={blog.blogId}>
                        <TableCell>
                          <div className="flex items-start gap-3">
                            {blog.featuredImage ? (
                              <img
                                src={blog.featuredImage.url}
                                alt={blog.featuredImage.altText}
                                className="hidden sm:block h-12 w-16 rounded object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="hidden sm:flex h-12 w-16 rounded bg-muted items-center justify-center flex-shrink-0">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium line-clamp-1">{blog.title}</div>
                              <div className="text-sm text-muted-foreground line-clamp-1">{blog.excerpt}</div>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {blog.readingTime ?? Math.ceil(blog.wordCount / 200)} min read
                                · {blog.wordCount} words
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={className}>{label}</Badge>
                        </TableCell>
                        <TableCell>
                          {blog.associatedWorkspaces.length > 0 ? (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Building2 className="h-3.5 w-3.5" />
                              {blog.associatedWorkspaces.length}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(blog.publishedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link to={`/admin/blogs/${blog.blogId}/edit`}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              {blog.status === "published" && (
                                <DropdownMenuItem asChild>
                                  <a
                                    href={`${import.meta.env.VITE_SITE_URL ?? ""}${blog.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Live
                                  </a>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  if (confirm(`Archive "${blog.title}"?`)) {
                                    archiveMutation.mutate(blog.blogId);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({totalBlogs} total)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
