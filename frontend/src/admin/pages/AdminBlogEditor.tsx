import { useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft, Save, Send, Plus, Trash2, Image, Type, List, Quote,
  Heading1, Heading2, MoveUp, MoveDown, Building2, Search, X, Upload,
  Globe, Eye, Settings,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type BlockType = "paragraph" | "heading" | "subheading" | "image" | "list" | "quote";

interface ContentBlock {
  id: string;
  type: BlockType;
  content: string;
  level?: number;
  listItems?: string[];
  image?: {
    url: string; publicId: string; width: number; height: number;
    bytes: number; format: string; altText: string; caption: string;
  };
  alignment?: "left" | "center" | "right" | "justify";
}

interface WorkspaceOption {
  workspaceId: string;
  displayName: string;
  slug: string;
  locality: string;
  city: string;
  heroPhotos: { url: string; publicId: string; altText: string; caption: string }[];
}

interface BlogState {
  title: string;
  excerpt: string;
  contentBlocks: ContentBlock[];
  categories: string[];
  tags: string[];
  status: "draft" | "pending_review" | "published";
  featuredImage: WorkspaceOption["heroPhotos"][0] | null;
  associatedWorkspaceIds: string[];
  allowComments: boolean;
  isFeatured: boolean;
  seoMetadata: {
    metaTitle: string; metaDescription: string; keywords: string[];
    ogTitle: string; ogDescription: string; canonicalUrl: string;
  };
}

const EMPTY_STATE: BlogState = {
  title: "", excerpt: "", contentBlocks: [], categories: [], tags: [],
  status: "draft", featuredImage: null, associatedWorkspaceIds: [],
  allowComments: true, isFeatured: false,
  seoMetadata: {
    metaTitle: "", metaDescription: "", keywords: [],
    ogTitle: "", ogDescription: "", canonicalUrl: "",
  },
};

function uid() { return Math.random().toString(36).slice(2, 10); }

// ─── Block toolbar ────────────────────────────────────────────────────────────

const BLOCK_TYPES: { type: BlockType; icon: React.FC<any>; label: string }[] = [
  { type: "paragraph", icon: Type, label: "Paragraph" },
  { type: "heading", icon: Heading1, label: "Heading" },
  { type: "subheading", icon: Heading2, label: "Subheading" },
  { type: "list", icon: List, label: "Bullet List" },
  { type: "quote", icon: Quote, label: "Quote" },
  { type: "image", icon: Image, label: "Image" },
];

// ─── Single content block component ──────────────────────────────────────────

function ContentBlockEditor({
  block, index, total,
  onChange, onDelete, onMove, onImageUpload,
  workspaceImages,
}: {
  block: ContentBlock; index: number; total: number;
  onChange: (b: ContentBlock) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
  onImageUpload: (file: File) => Promise<ContentBlock["image"]>;
  workspaceImages: WorkspaceOption["heroPhotos"][];
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const img = await onImageUpload(file);
      onChange({ ...block, image: img ?? undefined });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const blockClass = "border rounded-lg p-4 space-y-3 bg-card";

  return (
    <div className={blockClass}>
      {/* Block header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select
            value={block.type}
            onValueChange={(v) => onChange({ ...block, type: v as BlockType, listItems: v === "list" ? [""] : undefined })}
          >
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BLOCK_TYPES.map(({ type, label }) => (
                <SelectItem key={type} value={type} className="text-xs">{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">Block {index + 1}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={index === 0} onClick={() => onMove(-1)}>
            <MoveUp className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={index === total - 1} onClick={() => onMove(1)}>
            <MoveDown className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Block content */}
      {(block.type === "paragraph" || block.type === "quote") && (
        <Textarea
          value={block.content}
          onChange={(e) => onChange({ ...block, content: e.target.value })}
          placeholder={block.type === "quote" ? "Enter quote text..." : "Write your paragraph here..."}
          rows={4}
          className={block.type === "quote" ? "italic border-l-4 border-l-primary pl-3 rounded-none" : ""}
        />
      )}

      {(block.type === "heading" || block.type === "subheading") && (
        <Input
          value={block.content}
          onChange={(e) => onChange({ ...block, content: e.target.value })}
          placeholder={block.type === "heading" ? "Enter heading..." : "Enter subheading..."}
          className={block.type === "heading" ? "text-2xl font-bold" : "text-xl font-semibold"}
        />
      )}

      {block.type === "list" && (
        <div className="space-y-2">
          {(block.listItems ?? [""]).map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">•</span>
              <Input
                value={item}
                onChange={(e) => {
                  const items = [...(block.listItems ?? [""])];
                  items[i] = e.target.value;
                  onChange({ ...block, listItems: items, content: items.join("\n") });
                }}
                placeholder={`List item ${i + 1}`}
                className="flex-1"
              />
              <Button
                variant="ghost" size="icon" className="h-8 w-8 text-destructive flex-shrink-0"
                onClick={() => {
                  const items = (block.listItems ?? [""]).filter((_, idx) => idx !== i);
                  onChange({ ...block, listItems: items.length ? items : [""], content: items.join("\n") });
                }}
                disabled={(block.listItems ?? []).length <= 1}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline" size="sm" className="w-full"
            onClick={() => onChange({ ...block, listItems: [...(block.listItems ?? [""]), ""] })}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
          </Button>
        </div>
      )}

      {block.type === "image" && (
        <div className="space-y-3">
          {block.image ? (
            <div className="relative">
              <img src={block.image.url} alt={block.image.altText} className="w-full max-h-64 object-cover rounded" />
              <Button
                variant="destructive" size="sm" className="absolute top-2 right-2"
                onClick={() => onChange({ ...block, image: undefined })}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                  Uploading...
                </div>
              ) : (
                <>
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Click to upload image (max 10 MB)</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP, GIF</p>
                </>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
          )}
          {/* Or pick from workspace images */}
          {workspaceImages.flat().length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Or pick from workspace photos:</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {workspaceImages.flat().slice(0, 10).map((img, i) => (
                  <img
                    key={i}
                    src={img.url}
                    alt={img.altText}
                    className="h-16 w-20 object-cover rounded cursor-pointer flex-shrink-0 border-2 hover:border-primary transition-colors"
                    onClick={() => onChange({ ...block, image: { url: img.url, publicId: img.publicId, width: 0, height: 0, bytes: 0, format: "jpg", altText: img.altText, caption: img.caption } })}
                  />
                ))}
              </div>
            </div>
          )}
          {block.image && (
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={block.image.altText}
                onChange={(e) => onChange({ ...block, image: { ...block.image!, altText: e.target.value } })}
                placeholder="Alt text"
              />
              <Input
                value={block.image.caption}
                onChange={(e) => onChange({ ...block, image: { ...block.image!, caption: e.target.value } })}
                placeholder="Caption (optional)"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Workspace picker dialog ──────────────────────────────────────────────────

function WorkspacePicker({
  selected, onToggle,
}: {
  selected: string[];
  onToggle: (id: string, name: string, photos: WorkspaceOption["heroPhotos"]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ["blog-workspaces", query],
    queryFn: () => api.admin.searchWorkspacesForBlog({ query: query || undefined }),
    enabled: open,
    staleTime: 60_000,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Building2 className="h-4 w-4 mr-2" />
          Associate Workspace
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Workspaces to Associate</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search workspaces..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : workspaces.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No published workspaces found</p>
          ) : (
            <div className="space-y-2">
              {workspaces.map((ws: WorkspaceOption) => {
                const isSelected = selected.includes(ws.workspaceId);
                return (
                  <div
                    key={ws.workspaceId}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                    onClick={() => { onToggle(ws.workspaceId, ws.displayName, ws.heroPhotos); }}
                  >
                    {ws.heroPhotos[0] && (
                      <img src={ws.heroPhotos[0].url} alt={ws.displayName} className="h-12 w-16 object-cover rounded flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{ws.displayName}</div>
                      <div className="text-sm text-muted-foreground">{ws.locality}, {ws.city}</div>
                      <div className="text-xs text-muted-foreground">{ws.heroPhotos.length} photos available</div>
                    </div>
                    {isSelected && <Badge variant="secondary">Selected</Badge>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main editor component ────────────────────────────────────────────────────

export function AdminBlogEditor() {
  const { blogId } = useParams<{ blogId?: string }>();
  const isNew = !blogId || blogId === "new";
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [blog, setBlog] = useState<BlogState>(EMPTY_STATE);
  const [loaded, setLoaded] = useState(isNew);
  const [tagInput, setTagInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [keywordInput, setKeywordInput] = useState("");

  // Map workspaceId → photos for easy access in image blocks
  const [workspacePhotos, setWorkspacePhotos] = useState<Record<string, WorkspaceOption["heroPhotos"]>>({});

  // Load existing blog
  useQuery({
    queryKey: ["admin", "blog", blogId],
    queryFn: () => api.admin.getBlog(blogId!),
    enabled: !isNew,
    onSuccess: (data: any) => {
      setBlog({
        title: data.title ?? "",
        excerpt: data.excerpt ?? "",
        contentBlocks: (data.contentBlocks ?? []).map((b: any) => ({ ...b, id: b.id ?? uid() })),
        categories: data.categories ?? [],
        tags: data.tags ?? [],
        status: data.status ?? "draft",
        featuredImage: data.featuredImage ?? null,
        associatedWorkspaceIds: (data.associatedWorkspaces ?? []).map((w: any) => w.workspaceId),
        allowComments: data.allowComments ?? true,
        isFeatured: data.isFeatured ?? false,
        seoMetadata: data.seoMetadata ?? EMPTY_STATE.seoMetadata,
      });
      // Populate workspace photos map
      const photos: Record<string, WorkspaceOption["heroPhotos"]> = {};
      (data.associatedWorkspaces ?? []).forEach((w: any) => {
        photos[w.workspaceId] = w.workspaceImages ?? [];
      });
      setWorkspacePhotos(photos);
      setLoaded(true);
    },
  });

  const allWorkspacePhotos = Object.values(workspacePhotos);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (payload: any) =>
      isNew ? api.admin.createBlog(payload) : api.admin.updateBlog(blogId!, payload),
    onSuccess: (data: any) => {
      toast.success(isNew ? "Blog created" : "Blog saved");
      queryClient.invalidateQueries({ queryKey: ["admin", "blogs"] });
      if (isNew && data?.blogId) {
        navigate(`/admin/blogs/${data.blogId}/edit`, { replace: true });
      } else {
        queryClient.invalidateQueries({ queryKey: ["admin", "blog", blogId] });
      }
    },
    onError: () => toast.error("Failed to save blog"),
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: () =>
      api.admin.publishBlog(blogId!, { publishNow: true, sendNotifications: true }),
    onSuccess: () => {
      toast.success("Blog published!");
      queryClient.invalidateQueries({ queryKey: ["admin", "blogs"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "blog", blogId] });
    },
    onError: () => toast.error("Failed to publish blog"),
  });

  // SEO save mutation
  const seoMutation = useMutation({
    mutationFn: (seoData: any) => api.admin.updateBlogSeo(blogId!, seoData),
    onSuccess: () => toast.success("SEO metadata saved"),
    onError: () => toast.error("Failed to save SEO"),
  });

  // ── Block helpers ────────────────────────────────────────────────────────────

  const addBlock = (type: BlockType) => {
    const newBlock: ContentBlock = { id: uid(), type, content: "", listItems: type === "list" ? [""] : undefined };
    setBlog((b) => ({ ...b, contentBlocks: [...b.contentBlocks, newBlock] }));
  };

  const updateBlock = useCallback((id: string, updated: ContentBlock) => {
    setBlog((b) => ({ ...b, contentBlocks: b.contentBlocks.map((blk) => blk.id === id ? updated : blk) }));
  }, []);

  const deleteBlock = useCallback((id: string) => {
    setBlog((b) => ({ ...b, contentBlocks: b.contentBlocks.filter((blk) => blk.id !== id) }));
  }, []);

  const moveBlock = useCallback((id: string, dir: -1 | 1) => {
    setBlog((b) => {
      const blocks = [...b.contentBlocks];
      const i = blocks.findIndex((blk) => blk.id === id);
      if (i + dir < 0 || i + dir >= blocks.length) return b;
      [blocks[i], blocks[i + dir]] = [blocks[i + dir], blocks[i]];
      return { ...b, contentBlocks: blocks };
    });
  }, []);

  // ── Image upload helper ──────────────────────────────────────────────────────

  const uploadImage = useCallback(async (file: File): Promise<ContentBlock["image"]> => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("image_type", "content");
    const res = await api.admin.uploadBlogImage(fd);
    return res.image;
  }, []);

  // ── Workspace toggle ─────────────────────────────────────────────────────────

  const toggleWorkspace = (id: string, _name: string, photos: WorkspaceOption["heroPhotos"]) => {
    setBlog((b) => {
      const already = b.associatedWorkspaceIds.includes(id);
      return {
        ...b,
        associatedWorkspaceIds: already
          ? b.associatedWorkspaceIds.filter((x) => x !== id)
          : [...b.associatedWorkspaceIds, id],
      };
    });
    setWorkspacePhotos((p) => ({ ...p, [id]: photos }));
  };

  // ── Tag / category helpers ───────────────────────────────────────────────────

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !blog.tags.includes(t)) setBlog((b) => ({ ...b, tags: [...b.tags, t] }));
    setTagInput("");
  };

  const addCategory = () => {
    const c = categoryInput.trim();
    if (c && !blog.categories.includes(c)) setBlog((b) => ({ ...b, categories: [...b.categories, c] }));
    setCategoryInput("");
  };

  // ── Build save payload ───────────────────────────────────────────────────────

  const buildPayload = () => ({
    title: blog.title,
    excerpt: blog.excerpt,
    contentBlocks: blog.contentBlocks.map(({ id: _id, ...rest }) => rest),
    categories: blog.categories,
    tags: blog.tags,
    status: blog.status,
    featuredImage: blog.featuredImage ?? undefined,
    associatedWorkspaceIds: blog.associatedWorkspaceIds,
    allowComments: blog.allowComments,
    isFeatured: blog.isFeatured,
  });

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const wordCount = blog.contentBlocks.reduce((n, b) => n + (b.content?.split(/\s+/).filter(Boolean).length ?? 0), 0);
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/blogs")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{isNew ? "New Blog Post" : "Edit Blog Post"}</h1>
            <p className="text-xs text-muted-foreground">{wordCount} words · {readingTime} min read</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={blog.status}
            onValueChange={(v) => setBlog((b) => ({ ...b, status: v as BlogState["status"] }))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending_review">Pending Review</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => saveMutation.mutate(buildPayload())} disabled={saveMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? "Saving..." : "Save"}
          </Button>
          {!isNew && (
            <Button
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending || blog.status === "published"}
            >
              <Send className="h-4 w-4 mr-2" />
              {publishMutation.isPending ? "Publishing..." : "Publish"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: main content */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs defaultValue="content">
            <TabsList className="mb-4">
              <TabsTrigger value="content"><Type className="h-4 w-4 mr-2" />Content</TabsTrigger>
              <TabsTrigger value="seo"><Globe className="h-4 w-4 mr-2" />SEO</TabsTrigger>
              <TabsTrigger value="preview"><Eye className="h-4 w-4 mr-2" />Preview</TabsTrigger>
            </TabsList>

            {/* ── Content tab ── */}
            <TabsContent value="content" className="space-y-4 mt-0">
              {/* Title */}
              <div className="space-y-1">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={blog.title}
                  onChange={(e) => setBlog((b) => ({ ...b, title: e.target.value }))}
                  placeholder="Enter a compelling blog title..."
                  className="text-lg font-medium"
                />
              </div>

              {/* Excerpt */}
              <div className="space-y-1">
                <Label htmlFor="excerpt">Excerpt / Summary</Label>
                <Textarea
                  id="excerpt"
                  value={blog.excerpt}
                  onChange={(e) => setBlog((b) => ({ ...b, excerpt: e.target.value }))}
                  placeholder="A short summary shown in blog listings and SEO descriptions..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">{blog.excerpt.length}/300 chars recommended</p>
              </div>

              <Separator />

              {/* Content Blocks */}
              <div className="space-y-1">
                <Label>Content Blocks</Label>
                <p className="text-xs text-muted-foreground">Build your blog content by adding and reordering blocks below.</p>
              </div>

              {blog.contentBlocks.length === 0 && (
                <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
                  <Type className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No content blocks yet. Add your first block below.</p>
                </div>
              )}

              {blog.contentBlocks.map((block, i) => (
                <ContentBlockEditor
                  key={block.id}
                  block={block}
                  index={i}
                  total={blog.contentBlocks.length}
                  onChange={(b) => updateBlock(block.id, b)}
                  onDelete={() => deleteBlock(block.id)}
                  onMove={(dir) => moveBlock(block.id, dir)}
                  onImageUpload={uploadImage}
                  workspaceImages={allWorkspacePhotos}
                />
              ))}

              {/* Add block toolbar */}
              <div className="flex flex-wrap gap-2 pt-2">
                {BLOCK_TYPES.map(({ type, icon: Icon, label }) => (
                  <Button key={type} variant="outline" size="sm" onClick={() => addBlock(type)}>
                    <Icon className="h-3.5 w-3.5 mr-1" />{label}
                  </Button>
                ))}
              </div>
            </TabsContent>

            {/* ── SEO tab ── */}
            <TabsContent value="seo" className="space-y-4 mt-0">
              <Card>
                <CardHeader><CardTitle className="text-base">SEO Metadata</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <Label>Meta Title</Label>
                    <Input
                      value={blog.seoMetadata.metaTitle}
                      onChange={(e) => setBlog((b) => ({ ...b, seoMetadata: { ...b.seoMetadata, metaTitle: e.target.value } }))}
                      placeholder={blog.title || "SEO page title (50–60 chars recommended)"}
                    />
                    <p className="text-xs text-muted-foreground">{blog.seoMetadata.metaTitle.length}/60</p>
                  </div>
                  <div className="space-y-1">
                    <Label>Meta Description</Label>
                    <Textarea
                      value={blog.seoMetadata.metaDescription}
                      onChange={(e) => setBlog((b) => ({ ...b, seoMetadata: { ...b.seoMetadata, metaDescription: e.target.value } }))}
                      placeholder={blog.excerpt || "Meta description (150–160 chars recommended)"}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">{blog.seoMetadata.metaDescription.length}/160</p>
                  </div>
                  <div className="space-y-1">
                    <Label>Keywords</Label>
                    <div className="flex gap-2">
                      <Input
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === ",") {
                            e.preventDefault();
                            const k = keywordInput.trim().toLowerCase();
                            if (k && !blog.seoMetadata.keywords.includes(k)) {
                              setBlog((b) => ({ ...b, seoMetadata: { ...b.seoMetadata, keywords: [...b.seoMetadata.keywords, k] } }));
                            }
                            setKeywordInput("");
                          }
                        }}
                        placeholder="Type keyword and press Enter"
                      />
                      <Button type="button" variant="secondary" onClick={() => {
                        const k = keywordInput.trim().toLowerCase();
                        if (k && !blog.seoMetadata.keywords.includes(k)) {
                          setBlog((b) => ({ ...b, seoMetadata: { ...b.seoMetadata, keywords: [...b.seoMetadata.keywords, k] } }));
                        }
                        setKeywordInput("");
                      }}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {blog.seoMetadata.keywords.map((kw) => (
                        <Badge key={kw} variant="secondary" className="gap-1">
                          {kw}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => setBlog((b) => ({ ...b, seoMetadata: { ...b.seoMetadata, keywords: b.seoMetadata.keywords.filter((k) => k !== kw) } }))} />
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>OG Title (Social sharing)</Label>
                    <Input
                      value={blog.seoMetadata.ogTitle}
                      onChange={(e) => setBlog((b) => ({ ...b, seoMetadata: { ...b.seoMetadata, ogTitle: e.target.value } }))}
                      placeholder={blog.title || "Title shown when sharing on social media"}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>OG Description</Label>
                    <Textarea
                      value={blog.seoMetadata.ogDescription}
                      onChange={(e) => setBlog((b) => ({ ...b, seoMetadata: { ...b.seoMetadata, ogDescription: e.target.value } }))}
                      placeholder="Description shown when sharing on social media"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Canonical URL</Label>
                    <Input
                      value={blog.seoMetadata.canonicalUrl}
                      onChange={(e) => setBlog((b) => ({ ...b, seoMetadata: { ...b.seoMetadata, canonicalUrl: e.target.value } }))}
                      placeholder={`https://kosmixspaces.com/blog/${blog.title.toLowerCase().replace(/\s+/g, "-")}`}
                    />
                  </div>
                  {!isNew && (
                    <Button
                      variant="outline"
                      onClick={() => seoMutation.mutate(blog.seoMetadata)}
                      disabled={seoMutation.isPending}
                    >
                      {seoMutation.isPending ? "Saving..." : "Save SEO Metadata"}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Google SERP preview */}
              <Card>
                <CardHeader><CardTitle className="text-base">Search Result Preview</CardTitle></CardHeader>
                <CardContent>
                  <div className="p-4 border rounded-lg bg-background space-y-1">
                    <div className="text-sm text-green-700">kosmixspaces.com › blog</div>
                    <div className="text-blue-700 text-lg font-medium hover:underline cursor-pointer line-clamp-1">
                      {blog.seoMetadata.metaTitle || blog.title || "Blog Title"}
                    </div>
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {blog.seoMetadata.metaDescription || blog.excerpt || "Meta description will appear here..."}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Preview tab ── */}
            <TabsContent value="preview" className="mt-0">
              <Card>
                <CardContent className="pt-6">
                  <article className="prose prose-sm max-w-none">
                    {blog.featuredImage && (
                      <img src={blog.featuredImage.url} alt={blog.featuredImage.altText} className="w-full rounded-lg mb-6 not-prose" />
                    )}
                    <h1 className="text-3xl font-bold mb-3">{blog.title || "Untitled"}</h1>
                    {blog.excerpt && <p className="text-lg text-muted-foreground mb-6">{blog.excerpt}</p>}
                    {blog.contentBlocks.map((block) => {
                      if (block.type === "heading") return <h2 key={block.id} className="text-2xl font-bold mt-6 mb-3">{block.content}</h2>;
                      if (block.type === "subheading") return <h3 key={block.id} className="text-xl font-semibold mt-5 mb-2">{block.content}</h3>;
                      if (block.type === "paragraph") return <p key={block.id} className="mb-4 leading-relaxed">{block.content}</p>;
                      if (block.type === "quote") return <blockquote key={block.id} className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">{block.content}</blockquote>;
                      if (block.type === "list") return <ul key={block.id} className="list-disc pl-5 mb-4 space-y-1">{(block.listItems ?? []).map((item, i) => <li key={i}>{item}</li>)}</ul>;
                      if (block.type === "image" && block.image) return (
                        <figure key={block.id} className="my-6">
                          <img src={block.image.url} alt={block.image.altText} className="w-full rounded-lg" />
                          {block.image.caption && <figcaption className="text-center text-sm text-muted-foreground mt-2">{block.image.caption}</figcaption>}
                        </figure>
                      );
                      return null;
                    })}
                  </article>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: sidebar */}
        <div className="space-y-4">
          {/* Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="featured" className="cursor-pointer">Featured post</Label>
                <Switch
                  id="featured"
                  checked={blog.isFeatured}
                  onCheckedChange={(v) => setBlog((b) => ({ ...b, isFeatured: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="comments" className="cursor-pointer">Allow comments</Label>
                <Switch
                  id="comments"
                  checked={blog.allowComments}
                  onCheckedChange={(v) => setBlog((b) => ({ ...b, allowComments: v }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Featured image */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Featured Image</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {blog.featuredImage ? (
                <div className="relative">
                  <img src={blog.featuredImage.url} alt={blog.featuredImage.altText} className="w-full rounded object-cover aspect-video" />
                  <Button
                    variant="destructive" size="sm" className="absolute top-2 right-2"
                    onClick={() => setBlog((b) => ({ ...b, featuredImage: null }))}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No featured image set. Associate a workspace and pick from its photos below.</p>
              )}
              {allWorkspacePhotos.flat().length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-2">Pick from workspace photos:</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {allWorkspacePhotos.flat().slice(0, 9).map((img, i) => (
                      <img
                        key={i}
                        src={img.url}
                        alt={img.altText}
                        className={`aspect-video object-cover rounded cursor-pointer border-2 transition-colors ${blog.featuredImage?.url === img.url ? "border-primary" : "border-transparent hover:border-primary/50"}`}
                        onClick={() => setBlog((b) => ({ ...b, featuredImage: img }))}
                      />
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Categories</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCategory(); } }}
                  placeholder="Add category..."
                  className="text-sm"
                />
                <Button variant="secondary" size="sm" onClick={addCategory}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {blog.categories.map((c) => (
                  <Badge key={c} variant="secondary" className="gap-1">
                    {c}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setBlog((b) => ({ ...b, categories: b.categories.filter((x) => x !== c) }))} />
                  </Badge>
                ))}
                {blog.categories.length === 0 && <p className="text-xs text-muted-foreground">No categories yet</p>}
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Tags</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
                  placeholder="Add tag..."
                  className="text-sm"
                />
                <Button variant="secondary" size="sm" onClick={addTag}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {blog.tags.map((t) => (
                  <Badge key={t} variant="outline" className="gap-1 text-xs">
                    {t}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setBlog((b) => ({ ...b, tags: b.tags.filter((x) => x !== t) }))} />
                  </Badge>
                ))}
                {blog.tags.length === 0 && <p className="text-xs text-muted-foreground">No tags yet</p>}
              </div>
            </CardContent>
          </Card>

          {/* Associated Workspaces */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2"><Building2 className="h-4 w-4" />Workspaces</span>
                <WorkspacePicker selected={blog.associatedWorkspaceIds} onToggle={toggleWorkspace} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {blog.associatedWorkspaceIds.length === 0 ? (
                <p className="text-sm text-muted-foreground">No workspaces associated. Link a workspace to embed its photos and create an SEO-rich backlink.</p>
              ) : (
                <div className="space-y-2">
                  {blog.associatedWorkspaceIds.map((id) => {
                    const photos = workspacePhotos[id] ?? [];
                    return (
                      <div key={id} className="flex items-center gap-2 p-2 border rounded-lg">
                        {photos[0] && <img src={photos[0].url} alt="" className="h-10 w-12 object-cover rounded flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{photos[0]?.altText || id}</div>
                          <div className="text-xs text-muted-foreground">{photos.length} photos</div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive flex-shrink-0"
                          onClick={() => setBlog((b) => ({ ...b, associatedWorkspaceIds: b.associatedWorkspaceIds.filter((x) => x !== id) }))}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
