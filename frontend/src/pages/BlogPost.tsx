import { Link, useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { TEST_BLOG_ENABLED, testBlog } from "@/lib/testBlog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Clock, Calendar, Building2, ExternalLink, ChevronRight } from "lucide-react";

interface Image {
  url: string; publicId: string; altText: string; caption: string;
  width: number; height: number;
}

interface ContentBlock {
  type: string;
  content: string;
  level?: number;
  listItems?: string[];
  image?: Image;
  alignment?: string;
}

interface AssociatedWorkspace {
  workspaceId: string;
  displayName: string;
  slug: string;
  locality: string;
  city: string;
  workspaceImages: Image[];
}

interface BlogData {
  blogId: string;
  title: string;
  excerpt: string;
  slug: string;
  featuredImage?: Image;
  contentBlocks: ContentBlock[];
  categories: string[];
  tags: string[];
  publishedAt?: string;
  wordCount: number;
  readingTime?: number;
  associatedWorkspaces: AssociatedWorkspace[];
  seoMetadata?: {
    metaTitle?: string; metaDescription?: string; ogImage?: string;
    keywords?: string[]; canonicalUrl?: string;
  };
  allowComments?: boolean;
}

function formatDate(d?: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
}

function RenderBlock({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "heading":
      return <h2 className="text-2xl md:text-3xl font-bold mt-8 mb-3 scroll-mt-20">{block.content}</h2>;
    case "subheading":
      return <h3 className="text-xl md:text-2xl font-semibold mt-6 mb-2">{block.content}</h3>;
    case "paragraph":
      return <p className="text-base leading-relaxed text-foreground/90 mb-4">{block.content}</p>;
    case "quote":
      return (
        <blockquote className="border-l-4 border-primary bg-primary/5 rounded-r-lg px-5 py-4 my-6 italic text-muted-foreground">
          {block.content}
        </blockquote>
      );
    case "list":
      return (
        <ul className="list-disc pl-6 mb-4 space-y-1.5">
          {(block.listItems ?? block.content.split("\n")).filter(Boolean).map((item, i) => (
            <li key={i} className="text-base leading-relaxed text-foreground/90">{item}</li>
          ))}
        </ul>
      );
    case "image":
      if (!block.image) return null;
      return (
        <figure className="my-8">
          <img
            src={block.image.url}
            alt={block.image.altText}
            className="w-full rounded-xl object-cover max-h-[500px]"
          />
          {block.image.caption && (
            <figcaption className="text-center text-sm text-muted-foreground mt-2">
              {block.image.caption}
            </figcaption>
          )}
        </figure>
      );
    default:
      return null;
  }
}

export default function BlogPost() {
  const { "*": slugPath } = useParams();
  const navigate = useNavigate();

  // slugPath is whatever comes after /blog/ — e.g. "my-post-title"
  const { data: blog, isLoading, isError } = useQuery<BlogData>({
    queryKey: ["public-blog-post", slugPath],
    queryFn: () =>
      TEST_BLOG_ENABLED ? testBlog.getPost(slugPath ?? "") : api.blog.getPost(slugPath ?? ""),
    staleTime: 120_000,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (isError || !blog) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-muted-foreground">This article could not be found.</p>
        <Button asChild variant="outline">
          <Link to="/blog"><ArrowLeft className="h-4 w-4 mr-2" />Back to Blog</Link>
        </Button>
      </div>
    );
  }

  const readingTime = blog.readingTime ?? Math.max(1, Math.ceil(blog.wordCount / 200));
  const seo = blog.seoMetadata ?? {};

  return (
    <>
      <Helmet>
        <title>{seo.metaTitle || blog.title} – Kosmix Spaces</title>
        <meta name="description" content={seo.metaDescription || blog.excerpt} />
        {seo.keywords?.length && <meta name="keywords" content={seo.keywords.join(", ")} />}
        {seo.canonicalUrl && <link rel="canonical" href={seo.canonicalUrl} />}
        <meta property="og:title" content={seo.metaTitle || blog.title} />
        <meta property="og:description" content={seo.metaDescription || blog.excerpt} />
        {(seo.ogImage || blog.featuredImage?.url) && (
          <meta property="og:image" content={seo.ogImage || blog.featuredImage!.url} />
        )}
        <meta property="og:type" content="article" />
        {blog.publishedAt && <meta property="article:published_time" content={blog.publishedAt} />}
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Breadcrumb */}
        <div className="border-b border-border bg-muted/20">
          <div className="container py-3">
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-primary">Home</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link to="/blog" className="hover:text-primary">Blog</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground line-clamp-1 max-w-[200px]">{blog.title}</span>
            </nav>
          </div>
        </div>

        <div className="container py-10">
          <div className="grid lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
            {/* Main article */}
            <article className="lg:col-span-2 space-y-6">
              {/* Back link */}
              <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate("/blog")}>
                <ArrowLeft className="h-4 w-4 mr-2" />Back to Blog
              </Button>

              {/* Categories */}
              {blog.categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {blog.categories.map((c) => (
                    <Link key={c} to={`/blog?category=${encodeURIComponent(c)}`}>
                      <Badge variant="secondary">{c}</Badge>
                    </Link>
                  ))}
                </div>
              )}

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold leading-tight">{blog.title}</h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />{readingTime} min read
                </span>
                {blog.publishedAt && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />{formatDate(blog.publishedAt)}
                  </span>
                )}
              </div>

              {/* Excerpt */}
              {blog.excerpt && (
                <p className="text-lg text-muted-foreground leading-relaxed border-l-4 border-primary/30 pl-4">
                  {blog.excerpt}
                </p>
              )}

              {/* Featured image */}
              {blog.featuredImage && (
                <figure>
                  <img
                    src={blog.featuredImage.url}
                    alt={blog.featuredImage.altText}
                    className="w-full rounded-2xl object-cover max-h-[480px]"
                  />
                </figure>
              )}

              <Separator />

              {/* Content */}
              <div>
                {blog.contentBlocks.map((block, i) => (
                  <RenderBlock key={i} block={block} />
                ))}
              </div>

              {/* Tags */}
              {blog.tags.length > 0 && (
                <div className="pt-4">
                  <Separator className="mb-4" />
                  <div className="flex flex-wrap gap-2">
                    {blog.tags.map((t) => (
                      <Link key={t} to={`/blog?tag=${encodeURIComponent(t)}`}>
                        <Badge variant="outline" className="text-xs hover:bg-muted">#{t}</Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </article>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Associated workspaces */}
              {blog.associatedWorkspaces.length > 0 && (
                <div className="rounded-xl border border-border p-5 space-y-4 sticky top-24">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">Featured Workspaces</h3>
                  </div>
                  <div className="space-y-3">
                    {blog.associatedWorkspaces.map((ws) => (
                      <Link
                        key={ws.workspaceId}
                        to={ws.slug || "/explore"}
                        className="flex items-start gap-3 group rounded-lg p-2 -mx-2 hover:bg-muted/50 transition-colors"
                      >
                        {ws.workspaceImages?.[0] ? (
                          <img
                            src={ws.workspaceImages[0].url}
                            alt={ws.displayName}
                            className="h-14 w-18 rounded-md object-cover flex-shrink-0"
                            style={{ width: "72px" }}
                          />
                        ) : (
                          <div className="h-14 w-18 rounded-md bg-muted flex-shrink-0" style={{ width: "72px" }} />
                        )}
                        <div className="min-w-0">
                          <div className="font-medium text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
                            {ws.displayName}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {ws.locality}, {ws.city}
                          </div>
                          <span className="inline-flex items-center gap-1 text-xs text-primary mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            View space <ExternalLink className="h-3 w-3" />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Button asChild className="w-full" size="sm" variant="outline">
                    <Link to="/explore">Browse all spaces</Link>
                  </Button>
                </div>
              )}

              {/* CTA */}
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-5 space-y-3">
                <h3 className="font-semibold">Looking for a workspace in Delhi?</h3>
                <p className="text-sm text-muted-foreground">
                  Browse verified coworking spaces, private offices and meeting rooms — no hidden fees.
                </p>
                <Button asChild className="w-full">
                  <Link to="/explore">Explore Spaces</Link>
                </Button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
