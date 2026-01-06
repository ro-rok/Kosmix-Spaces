import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, MapPin, MessageCircle, BadgeCheck, Building2, Clock, Shield, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListingCard } from "@/components/ListingCard";
import { TrustStrip } from "@/components/TrustStrip";
import { FAQAccordion } from "@/components/FAQAccordion";
import { ShortlistDrawer } from "@/components/ShortlistDrawer";
import { listings, teamSizeBands, BudgetBand, budgetBandLabels } from "@/data/listings";
import { popularLocalities, localities } from "@/data/localities";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { transparencyLines } from "@/config/contact";

const featuredListings = listings.filter((l) => l.verificationStatus === "verified").slice(0, 6);

const budgetBands: { value: BudgetBand; label: string }[] = [
  { value: "5k-10k", label: "₹5K-10K" },
  { value: "10k-20k", label: "₹10K-20K" },
  { value: "20k-40k", label: "₹20K-40K" },
  { value: "40k-80k", label: "₹40K-80K" },
  { value: "80k+", label: "₹80K+" },
];

export default function Index() {
  const navigate = useNavigate();
  const [selectedLocality, setSelectedLocality] = useState("");
  const [selectedTeamSize, setSelectedTeamSize] = useState("");
  const [selectedBudget, setSelectedBudget] = useState("");

  const whatsappLink = buildWhatsAppLink({
    locality: selectedLocality,
    teamSize: selectedTeamSize,
    budgetBand: selectedBudget,
  });

  const handleBrowse = () => {
    const params = new URLSearchParams();
    if (selectedLocality) params.set("locality", selectedLocality);
    navigate(`/explore?${params.toString()}`);
  };

  return (
    <div className="pb-20 md:pb-0">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 py-12 md:py-20">
        <div className="container relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            {/* Headline */}
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl leading-tight">
              Verified workspaces across Delhi.
              <br />
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Shortlisted, negotiated, visit-ready.
              </span>
            </h1>
            
            {/* Subhead */}
            <p className="mt-4 text-base text-muted-foreground md:text-lg max-w-2xl mx-auto">
              Tell us locality + budget band. We'll shortlist verified options and schedule site visits.
            </p>

            {/* Search Form */}
            <div className="mt-8 mx-auto max-w-3xl">
              <div className="rounded-xl border border-border bg-card p-4 shadow-lg md:p-6">
                <div className="grid gap-4 md:grid-cols-3">
                  {/* Locality */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block text-left">
                      Locality
                    </label>
                    <Select value={selectedLocality} onValueChange={setSelectedLocality}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select area" />
                      </SelectTrigger>
                      <SelectContent>
                        {localities.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Team Size */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block text-left">
                      Team Size
                    </label>
                    <Select value={selectedTeamSize} onValueChange={setSelectedTeamSize}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="How many people?" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamSizeBands.map((band) => (
                          <SelectItem key={band.value} value={band.value}>{band.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Budget */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block text-left">
                      Budget / seat
                    </label>
                    <Select value={selectedBudget} onValueChange={setSelectedBudget}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Budget range" />
                      </SelectTrigger>
                      <SelectContent>
                        {budgetBands.map((band) => (
                          <SelectItem key={band.value} value={band.value}>{band.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* CTAs */}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button variant="cta" size="lg" asChild className="flex-1 sm:flex-none">
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-5 w-5" />
                      WhatsApp for Best Options
                    </a>
                  </Button>
                  <Button variant="outline" size="lg" onClick={handleBrowse} className="flex-1 sm:flex-none">
                    Browse Verified Spaces
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Trust Microlines */}
              <div className="mt-4 flex flex-col items-center gap-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  {transparencyLines.partnerFee}
                </p>
                <p className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Response within 24 hours
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute -top-40 right-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 left-0 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
      </section>

      {/* Locality Quick Chips */}
      <section className="py-8 bg-muted/30">
        <div className="container">
          <h2 className="text-center font-display text-lg font-semibold text-foreground mb-4">
            View spaces in popular areas
          </h2>
          <div className="flex flex-wrap justify-center gap-2">
            {popularLocalities.slice(0, 16).map((loc) => (
              <Link
                key={loc.id}
                to={`/explore?locality=${loc.id}`}
                className="flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-all hover:border-primary hover:bg-primary/5 hover:shadow-sm"
              >
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {loc.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <TrustStrip />

      {/* Featured Spaces */}
      <section className="py-12 md:py-16">
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
                Featured Verified Spaces
              </h2>
              <p className="mt-2 text-muted-foreground">
                Hand-picked workspaces across Delhi
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ShortlistDrawer />
              <Button variant="outline" asChild className="hidden sm:inline-flex">
                <Link to="/explore">
                  View All <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredListings.map((listing) => (
              <ListingCard key={listing.slug} listing={listing} />
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Button variant="outline" asChild>
              <Link to="/explore">
                View All Spaces <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works - Compact */}
      <section className="bg-muted/30 py-12 md:py-16">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
              How It Works
            </h2>
            <p className="mt-2 text-muted-foreground">
              Three simple steps to your perfect workspace
            </p>
          </div>

          <div className="mx-auto max-w-4xl">
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { 
                  step: "1", 
                  title: "Tell Us Requirements", 
                  desc: "Share locality, budget, team size via WhatsApp or form",
                  icon: MessageCircle
                },
                { 
                  step: "2", 
                  title: "Get Shortlist", 
                  desc: "We curate verified options matching your needs",
                  icon: BadgeCheck
                },
                { 
                  step: "3", 
                  title: "Visit & Move In", 
                  desc: "Schedule visits, negotiate terms, start working",
                  icon: Building2
                },
              ].map((item) => (
                <div key={item.step} className="relative rounded-xl border border-border bg-card p-6 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 text-center">
            <Button variant="outline" asChild>
              <Link to="/how-it-works">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 md:py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center font-display text-2xl font-bold text-foreground md:text-3xl mb-8">
              Frequently Asked Questions
            </h2>
            <FAQAccordion />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 md:py-16">
        <div className="container">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-glow p-8 text-center text-primary-foreground md:p-12">
            <h2 className="font-display text-2xl font-bold md:text-3xl">
              Ready to Find Your Workspace?
            </h2>
            <p className="mx-auto mt-4 max-w-xl opacity-90">
              WhatsApp us with your requirements and we'll shortlist the best options for you within 24 hours.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button variant="hero-outline" size="lg" asChild>
                <a href={buildWhatsAppLink()} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-5 w-5" />
                  WhatsApp Us Now
                </a>
              </Button>
              <Button variant="hero-outline" size="lg" asChild>
                <Link to="/explore">
                  Browse All Spaces <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <p className="mt-6 text-sm opacity-75">
              {transparencyLines.partnerFee}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
