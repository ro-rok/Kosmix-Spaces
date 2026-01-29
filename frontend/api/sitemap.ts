// Vercel serverless function to proxy sitemap.xml requests to backend
export default async function handler(
  request: any,
  response: any,
) {
  try {
    // Get backend URL from environment variable
    const backendUrl = process.env.VITE_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:8000';
    
    // Fetch sitemap from backend
    const backendResponse = await fetch(`${backendUrl}/sitemap.xml`, {
      headers: {
        'Accept': 'application/xml, text/xml, */*',
      },
    });

    if (!backendResponse.ok) {
      response.status(backendResponse.status).json({
        error: 'Failed to fetch sitemap from backend',
        status: backendResponse.status,
      });
      return;
    }

    const xmlContent = await backendResponse.text();

    // Set proper headers for XML content
    response.setHeader('Content-Type', 'application/xml');
    response.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    response.setHeader('X-Robots-Tag', 'noindex'); // Don't index the sitemap itself

    response.status(200).send(xmlContent);
  } catch (error) {
    console.error('Error fetching sitemap:', error);
    response.status(500).json({
      error: 'Internal server error while fetching sitemap',
    });
  }
}
