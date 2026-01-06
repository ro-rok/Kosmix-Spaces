import { useState } from "react";
import { Calendar, Clock, Users, CheckCircle, RefreshCw, MapPin, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockVisits } from "@/admin/mockData";
import { listings } from "@/data/listings";
import { buildWhatsAppLink, buildCallLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const statusTabs = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "rescheduled", label: "Reschedule" },
  { value: "completed", label: "Completed" },
];

export function AdminVisits() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSlot, setSelectedSlot] = useState("");

  const filteredVisits = mockVisits.filter((visit) => 
    statusFilter === "all" || visit.status === statusFilter
  );

  const handleConfirm = (visitId: string) => {
    if (!selectedSlot) {
      toast.error("Please select a slot to confirm");
      return;
    }
    toast.success("Visit confirmed successfully");
  };

  const handleRequestReschedule = (visitId: string) => {
    toast.success("Reschedule request sent to visitor");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Site Visits</h1>
        <p className="text-muted-foreground">Manage visit scheduling and confirmations</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {statusTabs.map((tab) => (
          <Button
            key={tab.value}
            variant={statusFilter === tab.value ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(tab.value)}
          >
            {tab.label}
            {tab.value !== "all" && (
              <span className="ml-1 text-xs opacity-70">
                ({mockVisits.filter((v) => v.status === tab.value).length})
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Visits List */}
      <div className="space-y-4">
        {filteredVisits.map((visit) => {
          const visitListings = visit.listingSlugs
            .map((slug) => listings.find((l) => l.slug === slug))
            .filter(Boolean);

          return (
            <div
              key={visit.id}
              className={cn(
                "rounded-lg border border-border bg-card p-5",
                visit.status === "pending" && "border-accent/50",
                visit.status === "confirmed" && "border-success/30"
              )}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg">{visit.leadName}</h3>
                    <span className={cn(
                      "inline-block mt-1 text-xs px-2 py-1 rounded-full capitalize",
                      visit.status === "pending" && "bg-accent/20 text-accent-foreground",
                      visit.status === "confirmed" && "bg-success/10 text-success",
                      visit.status === "completed" && "bg-muted text-muted-foreground",
                      visit.status === "rescheduled" && "bg-destructive/10 text-destructive",
                    )}>
                      {visit.status}
                    </span>
                  </div>

                  {/* Listings */}
                  <div className="flex flex-wrap gap-2">
                    {visitListings.map((listing) => (
                      <div key={listing!.slug} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm">
                          <p className="font-medium">{listing!.displayName}</p>
                          <p className="text-xs text-muted-foreground">{listing!.locality}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Details */}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {visit.visitorCount} {visit.visitorCount === 1 ? "visitor" : "visitors"}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {visit.preferredSlots.length} preferred slot{visit.preferredSlots.length > 1 ? "s" : ""}
                    </div>
                    {visit.confirmedSlot && (
                      <div className="flex items-center gap-1 text-success">
                        <CheckCircle className="h-4 w-4" />
                        {visit.confirmedSlot}
                      </div>
                    )}
                  </div>

                  {/* Preferred Slots */}
                  {visit.status === "pending" && (
                    <div className="flex flex-wrap gap-2">
                      {visit.preferredSlots.map((slot) => (
                        <span key={slot} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {slot}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 sm:items-end">
                  {visit.status === "pending" && (
                    <>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="default" size="sm">
                            <CheckCircle className="h-4 w-4" />
                            Confirm Slot
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Confirm Visit Slot</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select slot to confirm" />
                              </SelectTrigger>
                              <SelectContent>
                                {visit.preferredSlots.map((slot) => (
                                  <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button onClick={() => handleConfirm(visit.id)} className="w-full">
                              Confirm Visit
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRequestReschedule(visit.id)}
                      >
                        <RefreshCw className="h-4 w-4" />
                        Request Reschedule
                      </Button>
                    </>
                  )}

                  <div className="flex gap-2">
                    <Button variant="whatsapp" size="sm" asChild>
                      <a href={buildWhatsAppLink({ customMessage: `Hi ${visit.leadName}, regarding your site visit...` })} target="_blank">
                        <MessageCircle className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button variant="call" size="sm" asChild>
                      <a href={buildCallLink()}>
                        <Phone className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>

              {visit.notes && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">{visit.notes}</p>
                </div>
              )}
            </div>
          );
        })}

        {filteredVisits.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No visits match your filter
          </div>
        )}
      </div>
    </div>
  );
}
