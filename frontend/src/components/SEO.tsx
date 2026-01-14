import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: "summary" | "summary_large_image" | "app" | "player";
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  canonical?: string;
  noindex?: boolean;
}

const DEFAULT_TITLE = "Kosmix Spaces - Verified Coworking Spaces in Delhi NCR";
const DEFAULT_DESCRIPTION = "Find verified coworking spaces across Delhi, Gurugram, Noida. Zero brokerage, shortlisted options, site visits arranged. Browse 50+ verified workspaces.";
const DEFAULT_IMAGE = "/logo.png";
const SITE_URL = "https://kosmixspaces.com";

export function SEO({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogImage,
  ogUrl,
  twitterCard = "summary_large_image",
  twitterTitle,
  twitterDescription,
  twitterImage,
  canonical,
  noindex = false,
}: SEOProps) {
  // Use provided values or fall back to defaults
  const pageTitle = title || DEFAULT_TITLE;
  const pageDescription = description || DEFAULT_DESCRIPTION;
  const pageOgTitle = ogTitle || title || DEFAULT_TITLE;
  const pageOgDescription = ogDescription || description || DEFAULT_DESCRIPTION;
  const pageOgImage = ogImage || `${SITE_URL}${DEFAULT_IMAGE}`;
  const pageTwitterTitle = twitterTitle || ogTitle || title || DEFAULT_TITLE;
  const pageTwitterDescription = twitterDescription || ogDescription || description || DEFAULT_DESCRIPTION;
  const pageTwitterImage = twitterImage || ogImage || `${SITE_URL}${DEFAULT_IMAGE}`;
  const pageCanonical = canonical || (typeof window !== 'undefined' ? window.location.href : SITE_URL);
  const pageOgUrl = ogUrl || pageCanonical;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="title" content={pageTitle} />
      <meta name="description" content={pageDescription} />
      
      {/* Keywords */}
      {keywords && keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(", ")} />
      )}
      
      {/* Canonical URL */}
      <link rel="canonical" href={pageCanonical} />
      
      {/* Robots */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={pageOgUrl} />
      <meta property="og:title" content={pageOgTitle} />
      <meta property="og:description" content={pageOgDescription} />
      <meta property="og:image" content={pageOgImage} />
      <meta property="og:site_name" content="Kosmix Spaces" />
      
      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:url" content={pageOgUrl} />
      <meta name="twitter:title" content={pageTwitterTitle} />
      <meta name="twitter:description" content={pageTwitterDescription} />
      <meta name="twitter:image" content={pageTwitterImage} />
    </Helmet>
  );
}

// Helper component for JSON-LD structured data
interface StructuredDataProps {
  data: Record<string, any>;
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(data)}
      </script>
    </Helmet>
  );
}

