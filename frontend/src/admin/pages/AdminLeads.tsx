import { useState } from "react";
import { Phone, MessageCircle, AlertCircle, User, Search, List, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockLeads, getLeadCountsByStatus } from "@/admin/mockData";
import { LeadStatus, leadStatusLabels } from "@/admin/types";
import { buildWhatsAppLink, buildCallLink } from "@/lib/whatsapp";
import { localities } from "@/data/localities";
import { cn } from "@/lib/utils";

const statusColumns: LeadStatus[] = [
  "new",
  "qualifying", 
  "shortlist_sent",
  "visit_requested",
  "visit_scheduled",
  "quote_sent",
  "booked",
  "lost",
];

export function AdminLeads() {
  const [view, setView] = useState<"list" | "kanban">("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  
  const leadCounts = getLeadCountsByStatus();

  const filteredLeads = mockLeads.filter((lead) => {
    const matchesSearch = lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone.includes(search);
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground">Manage your sales pipeline</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "kanban" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("kanban")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as LeadStatus | "all")}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statusColumns.map((status) => (
              <SelectItem key={status} value={status}>
                {leadStatusLabels[status]} ({leadCounts[status]})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {view === "list" ? (
        <div className="space-y-3">
          {filteredLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
          {filteredLeads.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No leads match your filters
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {statusColumns.slice(0, 6).map((status) => (
              <div key={status} className="w-72 shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-sm">{leadStatusLabels[status]}</h3>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                    {leadCounts[status]}
                  </span>
                </div>
                <div className="space-y-3">
                  {mockLeads
                    .filter((l) => l.status === status)
                    .map((lead) => (
                      <LeadCard key={lead.id} lead={lead} compact />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LeadCard({ lead, compact = false }: { lead: typeof mockLeads[0]; compact?: boolean }) {
  const localityNames = lead.localityPrefs
    .map((id) => localities.find((l) => l.id === id)?.name || id)
    .join(", ");

  const whatsappLink = buildWhatsAppLink({
    customMessage: `Hi ${lead.name}, this is Kosmix Spaces. Following up on your workspace inquiry for ${lead.teamSizeBand} people in ${localityNames}.`,
  });

  return (
    <div className={cn(
      "rounded-lg border border-border bg-card p-4",
      lead.isUrgent && "border-destructive/30 bg-destructive/5"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{lead.name}</p>
              {lead.isUrgent && (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">{lead.phone}</p>
          </div>
        </div>
        {!compact && (
          <span className={cn(
            "text-xs px-2 py-1 rounded-full",
            lead.status === "new" && "bg-primary/10 text-primary",
            lead.status === "booked" && "bg-success/10 text-success",
            lead.status === "lost" && "bg-destructive/10 text-destructive",
            !["new", "booked", "lost"].includes(lead.status) && "bg-muted text-muted-foreground"
          )}>
            {leadStatusLabels[lead.status]}
          </span>
        )}
      </div>

      <div className="mt-3 space-y-1 text-sm">
        <p><span className="text-muted-foreground">Localities:</span> {localityNames}</p>
        <p><span className="text-muted-foreground">Team:</span> {lead.teamSizeBand} • {lead.budgetBand}</p>
        {!compact && (
          <>
            <p><span className="text-muted-foreground">Move-in:</span> {lead.moveInTimeframe}</p>
            {lead.company && <p><span className="text-muted-foreground">Company:</span> {lead.company}</p>}
          </>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="whatsapp" size="sm" className="flex-1" asChild>
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" />
            {compact ? "" : "WhatsApp"}
          </a>
        </Button>
        <Button variant="call" size="sm" className={compact ? "" : "flex-1"} asChild>
          <a href={buildCallLink()}>
            <Phone className="h-4 w-4" />
            {compact ? "" : "Call"}
          </a>
        </Button>
      </div>
    </div>
  );
}
