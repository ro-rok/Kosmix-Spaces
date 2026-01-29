# Google Search Console Setup Guide

This guide walks you through setting up Google Search Console for Kosmix Spaces to improve SEO and track search performance.

## Prerequisites

- Access to your domain's DNS settings OR ability to upload files to your website
- Google account
- Website must be live and accessible
- SSG build completed (`npm run build:ssg` in frontend directory)

---

## Step 1: Verify Domain Ownership

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click **"Add Property"**
3. Select **"URL prefix"** (recommended) or **"Domain"**
4. Enter your domain: `https://kosmixspaces.in`
5. Click **"Continue"**

### Verification Methods

#### Option A: HTML File Upload (Easiest)
1. Download the HTML verification file from Search Console
2. Upload it to your `public/` folder in the frontend
3. Ensure it's accessible at: `https://kosmixspaces.in/google1234567890abcdef.html`
4. Click **"Verify"** in Search Console

#### Option B: HTML Tag (Alternative)
1. Copy the meta tag from Search Console
2. Add it to `frontend/index.html` in the `<head>` section:
   ```html
   <meta name="google-site-verification" content="YOUR_VERIFICATION_CODE" />
   ```
3. Deploy and click **"Verify"**

#### Option C: DNS TXT Record (Most Permanent)
1. Add a TXT record to your DNS:
   - Name: `@` (or root domain)
   - Value: `google-site-verification=YOUR_VERIFICATION_CODE`
2. Wait 24-48 hours for DNS propagation
3. Click **"Verify"** in Search Console

---

## Step 2: Submit Sitemap

1. In Search Console, go to **"Sitemaps"** in the left sidebar
2. Enter your sitemap URL: `https://kosmixspaces.in/sitemap.xml`
3. Click **"Submit"**
4. Wait 24-48 hours for Google to process

### Verify Sitemap is Working

- Check that `https://kosmixspaces.in/sitemap.xml` is accessible
- Should include:
  - Static pages (/, /explore, /how-it-works, etc.)
  - All published listing URLs (`/spaces/{slug}`)

---

## Step 3: URL Inspection

Use the **URL Inspection** tool to test individual pages:

1. Go to **"URL Inspection"** in Search Console
2. Enter a listing URL: `https://kosmixspaces.in/spaces/workspace-name`
3. Click **"Test Live URL"**
4. Verify:
   - ✅ Page is indexable
   - ✅ Meta tags are present (`<title>`, `<meta name="description">`)
   - ✅ Structured data is valid (JSON-LD)
   - ✅ Canonical URL is correct
   - ✅ Mobile-friendly

### Common Issues

- **"Page not indexed"**: Check robots.txt, ensure no `noindex` tag
- **"Structured data invalid"**: Use [Rich Results Test](https://search.google.com/test/rich-results)
- **"Mobile usability issues"**: Ensure responsive design

---

## Step 4: Monitor Indexing

### Coverage Report

1. Go to **"Coverage"** in Search Console
2. Check for:
   - **Valid** pages (indexed successfully)
   - **Errors** (404s, blocked by robots.txt, etc.)
   - **Warnings** (indexed but has issues)

### Performance Report

1. Go to **"Performance"** to see:
   - Impressions (how often your pages appear in search)
   - Clicks (users clicking through)
   - Average position
   - Click-through rate (CTR)

---

## Step 5: Request Indexing (For New/Updated Pages)

When you publish a new listing or update content:

1. Use **URL Inspection** tool
2. Enter the URL
3. Click **"Request Indexing"**
4. Google will crawl within 24-48 hours

**Note**: Don't abuse this - only request for important pages.

---

## Step 6: Set Up Email Notifications

1. Go to **"Settings"** → **"Users and permissions"**
2. Add email addresses for notifications
3. Configure alerts for:
   - Coverage errors
   - Manual actions
   - Security issues

---

## Common Mistakes to Avoid

### ❌ Don't Block JavaScript in robots.txt
Google needs JavaScript to render SPAs. Our robots.txt allows Googlebot:
```
User-agent: Googlebot
Allow: /
```

### ❌ Don't Use `noindex` on Listing Pages
Only use `noindex` on:
- Admin portals (`/admin/*`)
- Partner portals (`/partner/*`)
- Test/development pages

### ❌ Don't Forget Canonical URLs
Every page should have a canonical tag to prevent duplicate content:
```html
<link rel="canonical" href="https://kosmixspaces.in/spaces/workspace-name" />
```

### ❌ Don't Ignore Mobile Usability
- Ensure responsive design
- Test on mobile devices
- Use Google's Mobile-Friendly Test tool

### ❌ Don't Skip Structured Data
JSON-LD structured data helps rich snippets:
- CoworkingSpace schema for listings
- LocalBusiness schema for contact pages
- Test with [Rich Results Test](https://search.google.com/test/rich-results)

---

## Testing Tools

### Google Tools
- **Rich Results Test**: https://search.google.com/test/rich-results
- **Mobile-Friendly Test**: https://search.google.com/test/mobile-friendly
- **PageSpeed Insights**: https://pagespeed.web.dev/

### Third-Party Tools
- **Schema.org Validator**: https://validator.schema.org/
- **Screaming Frog SEO Spider**: For crawling and analysis

---

## Maintenance

### Weekly
- Check Coverage report for errors
- Review Performance metrics
- Monitor new listings are indexed

### Monthly
- Review search queries and optimize content
- Check for manual actions or security issues
- Update sitemap if needed (auto-regenerates on listing changes)

### Quarterly
- Review and optimize meta descriptions
- Check structured data validity
- Analyze top-performing pages

---

## Troubleshooting

### Sitemap Not Found
- Verify `/sitemap.xml` is accessible
- Check backend logs for sitemap generation errors
- Ensure MongoDB connection is working

### Pages Not Indexing
- Check robots.txt isn't blocking
- Verify no `noindex` meta tag
- Use URL Inspection to request indexing
- Check for crawl errors in Coverage report

### Structured Data Errors
- Use Rich Results Test to validate
- Check JSON-LD syntax
- Ensure required fields are present

---

## Additional Resources

- [Google Search Central](https://developers.google.com/search)
- [Search Console Help](https://support.google.com/webmasters)
- [Structured Data Guide](https://developers.google.com/search/docs/appearance/structured-data)

---

## Support

If you encounter issues:
1. Check Search Console messages
2. Review this guide
3. Consult Google Search Central documentation
4. Contact technical support if needed
