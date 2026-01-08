import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminListings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Listings Management</h1>
        <p className="text-muted-foreground">Manage and verify workspace listings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Listings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-12">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Admin API Not Implemented</h3>
            <p>Admin listing management endpoints are not yet implemented.</p>
            <p className="text-sm mt-2">This will show listing verification, approval, and management tools.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}