import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, MapPin, MessageCircle, BadgeCheck, Building2, Clock, Shield, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ListingCard } from "@/components/ListingCard";
import { TrustStrip } from "@/components/TrustStrip";
import { FAQAccordion } from "@/components/FAQAccordion";
import { ShortlistDrawer } from "@/components/ShortlistDrawer";
import { StaggerAnimation } from "@/components/StaggerAnimation";
import { ScrollTriggerAnimation } from "@/components/ScrollTriggerAnimation";
import { AnimatedButton } from "@/components/AnimatedButton";
import { useListings, useLocalities } from "@/hooks/useApi";
import { teamSizeBands, BudgetBand, budgetBandLabels } from "@/types/models";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { transparencyLines } from "@/config/contact";
import { SEO } from "@/components/SEO";

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

  // Fetch data from API
  const { data: localitiesData } = useLocalities();
  const localities = localitiesData?.localities || localitiesData?.flat || [];
  const { data: featuredListingsData } = useListings({
    sort: "recent_verified",
    pageSize: 6,
  });

  const localitiesByCity = localitiesData?.by_city || {};
  const popularLocalities = localities.filter(l => l.popular);
  const featuredListings = featuredListingsData?.items || [];
  
  // Available cities
  const cities = ["Delhi", "Gurugram", "Noida"];
  
  // State for city selection
  const [selectedCity, setSelectedCity] = useState("");

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

const testimonials = [
  {
    quote:
      "Highly recommended Kosmix Spaces. The services are next level with prompt service delivery and above expectations. The way Ms. Swati managed quick solutions to our needs is really fantastic.",
    name: "Ms. Suchi Verma",
    title: "Associate Director, National Sales",
    company: "The Park New Delhi",
  },
  {
    quote:
      "I cannot speak highly enough of my experience with Kosmix Spaces in my search for office space in Noida. From the outset, their assistance was exceptional. Swati Kapoor guided me through every step, from the initial search to the final signing of the contract. Their commitment to a seamless experience and zero brokerage is truly commendable.",
    name: "Naief Khatri",
    title: "Head of Solutions",
    company: "TMotions Global Pvt Ltd",
  },
  {
    quote:
      "The team of Kosmix Spaces led by Swati Kapoor has always shown a relentless pursuit of the highest standards of professionalism and client satisfaction, apart from closing good deals at Innov8 Coworking. Their impeccable negotiation skills with corporates and landlords, product knowledge, objection handling, and resilience make them a valuable partner.",
    name: "Faisal Khan",
    title: "Regional Head & Director of Sales",
    company: "OYO Workspaces India Pvt Ltd",
  },
];

  return (
    <>
      <SEO
        title="Verified Coworking Spaces in Delhi, Gurugram, Noida | Kosmix Spaces"
        description="Find verified coworking spaces across Delhi NCR. Zero brokerage, shortlisted options, site visits arranged. Browse 50+ verified workspaces in prime locations."
        keywords={[
          "coworking space delhi",
          "coworking space gurugram",
          "coworking space noida",
          "office space delhi",
          "workspace delhi ncr",
          "verified coworking",
          "zero brokerage coworking"
        ]}
        canonical="https://kosmixspaces.com/"
      />
      <div className="pb-20 md:pb-0">
        {/* Hero Section */}
      <section className="relative min-h-[95vh] flex items-center pt-20 lg:pt-0">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/hero-workspace.jpg"
            alt="Modern workspace"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/60" />
        </div>
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
                <div className="grid gap-4 md:grid-cols-4">
                  {/* City */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block text-left">
                      City
                    </label>
                    <Select value={selectedCity} onValueChange={(value) => {
                      setSelectedCity(value);
                      setSelectedLocality(""); // Clear locality when city changes
                    }}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Locality - Only show if city is selected */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block text-left">
                      Locality
                    </label>
                    <Select 
                      value={selectedLocality} 
                      onValueChange={setSelectedLocality}
                      disabled={!selectedCity}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={selectedCity ? `Select area in ${selectedCity}` : "Select city first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedCity && localitiesByCity[selectedCity]?.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name}
                            {loc.popular && (
                              <span className="ml-2 text-xs text-primary">Popular</span>
                            )}
                          </SelectItem>
                        ))}
                        {selectedCity && (
                          <SelectItem value="other-locality" className="border-t border-border mt-1 pt-2">
                            <span className="text-muted-foreground">Other (Not Listed)</span>
                          </SelectItem>
                        )}
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
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
                  <AnimatedButton 
                    variant="cta" 
                    size="default"
                    asChild 
                    className="w-full sm:w-auto"
                    intensity="normal"
                  >
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp for Best Options
                    </a>
                  </AnimatedButton>
                  <AnimatedButton 
                    variant="outline" 
                    size="default"
                    onClick={handleBrowse} 
                    className="w-full sm:w-auto"
                    intensity="subtle"
                  >
                    Browse Verified Spaces
                    <ArrowRight className="h-4 w-4" />
                  </AnimatedButton>
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
                  Response within 3 hours
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

          <StaggerAnimation
            stagger={0.15}
            from="start"
            animation={{
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.7,
              ease: "power2.out",
            }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {featuredListings.map((listing) => (
              <ListingCard 
                key={listing.slug} 
                listing={listing}
                enableScrollAnimation={false} // Disable individual scroll animation since we're using stagger
              />
            ))}
          </StaggerAnimation>

          <div className="mt-8 text-center sm:hidden">
            <AnimatedButton variant="outline" asChild intensity="normal">
              <Link to="/explore">
                View All Spaces <ArrowRight className="h-4 w-4" />
              </Link>
            </AnimatedButton>
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
            <StaggerAnimation
              stagger={0.2}
              from="start"
              animation={{
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.8,
                ease: "power2.out",
              }}
              className="grid gap-6 md:grid-cols-3"
            >
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
            </StaggerAnimation>
          </div>

          <div className="mt-8 text-center">
            <Button variant="outline" asChild>
              <Link to="/how-it-works">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
              What Our Partners Say
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              A few words from leaders we've worked with across hospitality, technology, and coworking.
            </p>
          </div>
          
          <StaggerAnimation
            stagger={0.15}
            from="start"
            animation={{
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.7,
              ease: "power2.out",
            }}
            className="grid gap-6 md:grid-cols-3"
          >
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <p className="text-foreground leading-relaxed mb-4">
                      &ldquo;{testimonial.quote}&rdquo;
                    </p>
                  </div>
                  <div className="border-t border-border pt-4 mt-auto">
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">{testimonial.title}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </StaggerAnimation>
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
          <ScrollTriggerAnimation
            animation={{
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.8,
              ease: "power2.out",
            }}
            start="top 80%"
          >
            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-glow p-8 text-center text-primary-foreground md:p-12">
              <h2 className="font-display text-2xl font-bold md:text-3xl">
                Ready to Find Your Workspace?
              </h2>
              <p className="mx-auto mt-4 max-w-xl opacity-90">
                WhatsApp us with your requirements and we'll shortlist the best options for you within 3 hours.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                <AnimatedButton variant="hero-outline" size="default" asChild intensity="normal" className="w-full sm:w-auto">
                  <a href={buildWhatsAppLink()} target="_blank" rel="noopener noreferrer" className="gap-2">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp Us Now
                  </a>
                </AnimatedButton>
                <AnimatedButton variant="hero-outline" size="default" asChild intensity="subtle" className="w-full sm:w-auto">
                  <Link to="/explore" className="gap-2">
                    Browse All Spaces <ArrowRight className="h-4 w-4" />
                  </Link>
                </AnimatedButton>
              </div>
              <p className="mt-6 text-sm opacity-75">
                {transparencyLines.partnerFee}
              </p>
            </div>
          </ScrollTriggerAnimation>
        </div>
      </section>
      </div>
    </>
  );
}
