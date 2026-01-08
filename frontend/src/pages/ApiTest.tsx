import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function ApiTest() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const testEndpoint = async (name: string, testFn: () => Promise<any>) => {
    setLoading(prev => ({ ...prev, [name]: true }));
    try {
      const result = await testFn();
      setResults(prev => ({ ...prev, [name]: { success: true, data: result } }));
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        [name]: { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        } 
      }));
    } finally {
      setLoading(prev => ({ ...prev, [name]: false }));
    }
  };

  const tests = [
    {
      name: 'Health Check',
      key: 'health',
      test: () => api.healthCheck(),
    },
    {
      name: 'Get Localities',
      key: 'localities',
      test: () => api.getLocalities(),
    },
    {
      name: 'Get Listings',
      key: 'listings',
      test: () => api.getListings({ pageSize: 5 }),
    },
    {
      name: 'Test Partner Registration',
      key: 'partner-register',
      test: () => api.auth.registerPartner({
        workspaceBrandName: "Test Workspace",
        contactName: "Test User",
        phone: "9876543210",
        email: `test${Date.now()}@example.com`,
        password: "test123",
      }),
    },
  ];

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">API Connection Test</h1>
        <p className="text-muted-foreground mt-2">
          Test the connection to the backend API at: {import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}
        </p>
      </div>

      <div className="grid gap-4">
        {tests.map((test) => (
          <Card key={test.key}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{test.name}</CardTitle>
                <div className="flex items-center gap-2">
                  {loading[test.key] && <Loader2 className="h-4 w-4 animate-spin" />}
                  {results[test.key] && (
                    results[test.key].success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )
                  )}
                  <Button
                    size="sm"
                    onClick={() => testEndpoint(test.key, test.test)}
                    disabled={loading[test.key]}
                  >
                    Test
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {results[test.key] && (
                <div className="mt-2">
                  {results[test.key].success ? (
                    <div>
                      <p className="text-sm text-green-600 font-medium mb-2">✓ Success</p>
                      <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                        {JSON.stringify(results[test.key].data, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-red-600 font-medium mb-2">✗ Failed</p>
                      <p className="text-sm text-red-600">{results[test.key].error}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Button
          onClick={() => {
            tests.forEach(test => testEndpoint(test.key, test.test));
          }}
          disabled={Object.values(loading).some(Boolean)}
        >
          Test All Endpoints
        </Button>
      </div>
    </div>
  );
}