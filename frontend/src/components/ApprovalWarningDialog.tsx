import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle } from "lucide-react";

interface ApprovalWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
  listingName: string;
}

export function ApprovalWarningDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  listingName,
}: ApprovalWarningDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <AlertDialogTitle className="text-lg">Confirm Listing Approval</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base pt-4 space-y-3">
            <p>
              You are about to approve <span className="font-semibold text-foreground">"{listingName}"</span>.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
              <p className="font-semibold text-yellow-900">Important:</p>
              <ul className="list-disc list-inside space-y-1 text-yellow-800 text-sm">
                <li>This listing is currently pending approval</li>
                <li>Once approved, it will be publicly visible on the website</li>
                <li>If the partner edits it later, it will revert to pending status</li>
                <li>The listing will remain unlisted until you re-approve it</li>
              </ul>
            </div>
            <p className="text-muted-foreground">
              Please ensure you have reviewed all details before approving.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? "Approving..." : "Yes, Approve Listing"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

