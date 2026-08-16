import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { TEST_BLOG_ENABLED, testBlog } from "@/lib/testBlog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Clock, Building2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BlogCard {
  blogId: string;
  title: string;
  excerpt: string;
  slug: string;
  featuredImage?: { url: string; altText: string };
  categories: string[];
  tags: string[];
  publishedAt?: string;
  wordCount: number;
  readingTime?: number;
  isFeatured?: boolean;
  associatedWorkspaces?: { displayName: string; slug: string }[];
}

function formatDate(d?: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
}

function readTime(blog: BlogCard) {
  return blog.readingTime ?? Math.max(1, Math.ceil(blog.wordCount / 200));
}

// Extracts the slug path usable in <Link to>
function blogPath(slug: string) {
  // slug stored as "/blog/my-post" → route is "/blog/my-post"
  return slug.startsWith("/") ? slug : `/${slug}`;
}

export default function Blog() {
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["public-blogs", { page, search, activeCategory }],
    queryFn: () =>
      TEST_BLOG_ENABLED
        ? testBlog.getBlogs({ page, limit: 9 })
        : api.blog.getBlogs({
            page,
            limit: 9,
            search: search || undefined,
            category: activeCategory || undefined,
          }),
    staleTime: 60_000,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["public-blog-categories"],
    queryFn: () => (TEST_BLOG_ENABLED ? testBlog.getCategories() : api.blog.getCategories()),
    staleTime: 300_000,
  });

  const blogs: BlogCard[] = data?.blogs ?? [];
  const totalPages = data?.totalPages ?? 1;

  const featured = blogs.find((b) => b.isFeatured);
  const rest = blogs.filter((b) => !b.isFeatured || b !== featured);

  return (
    <>
      <Helmet>
        <title>Blog – Kosmix Spaces | Workspace Insights & Coworking Guides</title>
        <meta
          name="description"
          content="Discover workspace guides, coworking trends, and startup insights from Kosmix Spaces. Find the perfect workspace in Delhi."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="border-b border-border bg-muted/30 py-16">
          <div className="container max-w-3xl text-center space-y-4">
            <Badge variant="secondary" className="text-xs uppercase tracking-wider">Kosmix Spaces Blog</Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Workspace Insights &amp; Coworking Guides
            </h1>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about finding and choosing the right workspace in Delhi.
            </p>

            {/* Search */}
            <form
              className="mt-6 flex gap-2 max-w-md mx-auto"
              onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }}
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit">Search</Button>
            </form>
          </div>
        </section>

        <div className="container py-12 space-y-10">
          {/* Category pills */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setActiveCategory(""); setPage(1); }}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium border transition-colors",
                  !activeCategory
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                )}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.name}
                  onClick={() => { setActiveCategory(c.name); setPage(1); }}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-medium border transition-colors",
                    activeCategory === c.name
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                  )}
                >
                  {c.name} <span className="opacity-60">({c.count})</span>
                </button>
              ))}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-24">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-24 text-muted-foreground">
              <p className="text-lg">No posts found.</p>
              {(search || activeCategory) && (
                <Button variant="ghost" className="mt-3" onClick={() => { setSearch(""); setSearchInput(""); setActiveCategory(""); }}>
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Featured post */}
              {featured && page === 1 && !search && !activeCategory && (
                <Link to={blogPath(featured.slug)} className="group block">
                  <div className="grid md:grid-cols-2 gap-6 rounded-2xl border border-border overflow-hidden hover:border-primary/50 transition-colors">
                    {featured.featuredImage ? (
                      <img
                        src={featured.featuredImage.url}
                        alt={featured.featuredImage.altText}
                        className="w-full h-64 md:h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-64 md:h-full bg-muted flex items-center justify-center">
                        <span className="text-4xl">✍️</span>
                      </div>
                    )}
                    <div className="p-6 md:p-8 flex flex-col justify-center space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge>Featured</Badge>
                        {featured.categories[0] && (
                          <Badge variant="outline">{featured.categories[0]}</Badge>
                        )}
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold leading-tight group-hover:text-primary transition-colors">
                        {featured.title}
                      </h2>
                      <p className="text-muted-foreground line-clamp-3">{featured.excerpt}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{readTime(featured)} min</span>
                        {featured.publishedAt && <span>·</span>}
                        {featured.publishedAt && <span>{formatDate(featured.publishedAt)}</span>}
                      </div>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                        Read article <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              )}

              {/* Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                {rest.map((blog) => (
                  <Link
                    key={blog.blogId}
                    to={blogPath(blog.slug)}
                    className="group flex flex-col rounded-xl border border-border overflow-hidden hover:border-primary/50 hover:shadow-md transition-all"
                  >
                    {blog.featuredImage ? (
                      <img
                        src={blog.featuredImage.url}
                        alt={blog.featuredImage.altText}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-muted flex items-center justify-center">
                        <span className="text-3xl">✍️</span>
                      </div>
                    )}
                    <div className="flex flex-col flex-1 p-5 space-y-3">
                      {blog.categories[0] && (
                        <Badge variant="secondary" className="w-fit text-xs">{blog.categories[0]}</Badge>
                      )}
                      <h3 className="font-bold text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {blog.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                        {blog.excerpt}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {readTime(blog)} min read
                          {(blog.associatedWorkspaces?.length ?? 0) > 0 && (
                            <>
                              <span>·</span>
                              <Building2 className="h-3 w-3" />
                              {blog.associatedWorkspaces!.length}
                            </>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDate(blog.publishedAt)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4">
                  <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                  <Button variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
