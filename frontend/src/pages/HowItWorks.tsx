import { Link } from "react-router-dom";
import { Search, ListChecks, Eye, Key, MessageCircle, Shield, Clock, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { transparencyLines } from "@/config/contact";
import { SEO } from "@/components/SEO";

const steps = [
  {
    icon: Search,
    title: "Search & Filter",
    description: "Browse verified workspaces by locality, budget, team size, and amenities. Use our filters to find spaces that match your exact requirements.",
  },
  {
    icon: ListChecks,
    title: "Shortlist Options",
    description: "Compare multiple spaces side by side. Check amenities, budget ranges, and availability. No need to visit every option – we help you narrow down.",
  },
  {
    icon: Eye,
    title: "Schedule Visits",
    description: "Request site visits for your top choices. We coordinate with workspaces to arrange visits at your convenience. See the space before you commit.",
  },
  {
    icon: Key,
    title: "Finalize & Move In",
    description: "Once you've found the right fit, finalize terms directly with the workspace. We're here to help with any questions during the process.",
  },
];

const benefits = [
  {
    icon: BadgeCheck,
    title: "Verified Spaces Only",
    description: "Every listing with a 'Verified' badge has been personally visited and vetted by our team.",
  },
  {
    icon: Shield,
    title: "No Customer Fees",
    description: "You pay nothing to Kosmix. If you book, we may earn a partner fee from the workspace.",
  },
  {
    icon: Clock,
    title: "Quick Response",
    description: "We respond to every enquiry within 3 hours. WhatsApp for even faster turnaround.",
  },
  {
    icon: MessageCircle,
    title: "Expert Guidance",
    description: "Not sure what you need? Our team helps you understand options and find the right fit.",
  },
];

export default function HowItWorks() {
  return (
    <>
      <SEO
        title="How It Works - Find Your Perfect Coworking Space | Kosmix Spaces"
        description="Learn how Kosmix Spaces helps you find verified coworking spaces. Search, shortlist, visit, and move in. No customer fees, quick response, expert guidance."
        keywords={[
          "how coworking works",
          "find office space",
          "coworking space process",
          "workspace search",
          "verified coworking"
        ]}
        canonical="https://kosmixspaces.in/how-it-works"
      />
      <div>
        {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-accent/5 py-16 md:py-24">
        <div className="container text-center">
          <h1 className="font-display text-3xl font-bold text-foreground md:text-5xl">
            How Kosmix Spaces Works
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Simple steps to find your ideal workspace in Delhi.
            <br />
            <strong>No customer fees. Expert guidance. Verified spaces.</strong>
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            {steps.map((step, index) => (
              <div key={step.title} className="relative flex gap-6 pb-12 last:pb-0">
                {/* Line connector */}
                {index < steps.length - 1 && (
                  <div className="absolute left-6 top-14 h-full w-px bg-border" />
                )}
                {/* Step number */}
                <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground">
                  {index + 1}
                </div>
                {/* Content */}
                <div className="pt-2">
                  <div className="flex items-center gap-2">
                    <step.icon className="h-5 w-5 text-primary" />
                    <h3 className="font-display text-xl font-semibold text-foreground">
                      {step.title}
                    </h3>
                  </div>
                  <p className="mt-2 text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-muted/30 py-16">
        <div className="container">
          <h2 className="text-center font-display text-2xl font-bold text-foreground md:text-3xl">
            Why Choose Kosmix Spaces?
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-xl border border-border bg-card p-6 text-center"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-display font-semibold text-foreground">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Transparency */}
      <section className="py-16">
        <div className="container">
          <div className="mx-auto max-w-2xl rounded-xl bg-primary/5 p-8 text-center">
            <h2 className="font-display text-xl font-semibold text-foreground">
              Our Commitment to Transparency
            </h2>
            <p className="mt-4 text-muted-foreground">
              {transparencyLines.partnerFee}
            </p>
            <p className="mt-2 text-muted-foreground">
              We believe in honest, straightforward service. No hidden fees, no surprises.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border py-16">
        <div className="container text-center">
          <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
            Ready to Get Started?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Tell us what you're looking for and we'll help you find the perfect workspace.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button variant="whatsapp" size="lg" asChild>
              <a href={buildWhatsAppLink()} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-5 w-5" />
                WhatsApp Us Now
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/explore">Browse All Spaces</Link>
            </Button>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}
