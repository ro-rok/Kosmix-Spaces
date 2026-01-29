import { Link } from "react-router-dom";
import { Building2, Users, TrendingUp, Shield, MessageCircle, BadgeCheck, Clock, Handshake, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildWhatsAppLink, buildEmailLink } from "@/lib/whatsapp";
import { handleEmailClick } from "@/lib/email";
import { contactConfig } from "@/config/contact";
import { SEO, StructuredData } from "@/components/SEO";
import { generateBreadcrumbSchema } from "@/lib/seo-helpers";

const benefits = [
  {
    icon: Users,
    title: "Quality Leads",
    description: "We pre-qualify enquiries so you receive leads from serious, ready-to-move businesses.",
  },
  {
    icon: TrendingUp,
    title: "Increased Visibility",
    description: "Get discovered by businesses actively searching for workspaces in Delhi.",
  },
  {
    icon: Shield,
    title: "Protected Information",
    description: "We don't share your exact address publicly. Privacy for both you and potential clients.",
  },
  {
    icon: Handshake,
    title: "Pay on Success",
    description: "Partner fee only applies after successful booking. No upfront costs.",
  },
];

const howItWorks = [
  {
    step: "1",
    title: "List Your Space",
    description: "Share details about your workspace – types available, capacity, amenities, and budget ranges.",
  },
  {
    step: "2",
    title: "We Verify",
    description: "Our team visits your space to verify information and take professional photos.",
  },
  {
    step: "3",
    title: "Go Live",
    description: "Your verified listing goes live and reaches businesses searching for workspace.",
  },
  {
    step: "4",
    title: "Receive Leads",
    description: "We send you pre-qualified leads. You handle the tour and closing.",
  },
];

export default function Partners() {
  const partnerWhatsApp = buildWhatsAppLink({
    listingName: "[Partner Enquiry]",
  });

  return (
    <>
      <SEO
        title="List Your Workspace - Partner with Kosmix Spaces"
        description="List your coworking space on Kosmix Spaces. Reach quality leads, increase visibility. Partner fee only on successful bookings. No upfront costs."
        keywords={[
          "list coworking space",
          "workspace partners",
          "coworking space listing",
          "partner program",
          "list office space"
        ]}
        canonical="https://kosmixspaces.in/partners"
      />
      <div>
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/5 via-background to-accent/5 py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              For Workspace Operators
            </span>
            <h1 className="mt-6 font-display text-3xl font-bold text-foreground md:text-5xl">
              Partner with Kosmix Spaces
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              List your workspace and connect with businesses looking for their next office in Delhi.
              Quality leads. No upfront costs.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button variant="default" size="lg" asChild>
                <a href={partnerWhatsApp} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-5 w-5" />
                  Become a Partner
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href={buildEmailLink("Partnership Enquiry")}>
                  Email Us
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16">
        <div className="container">
          <h2 className="text-center font-display text-2xl font-bold text-foreground md:text-3xl">
            Why List with Us?
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

      {/* How It Works */}
      <section className="bg-muted/30 py-16">
        <div className="container">
          <h2 className="text-center font-display text-2xl font-bold text-foreground md:text-3xl">
            How Partnership Works
          </h2>
          <div className="mx-auto mt-10 max-w-3xl">
            {howItWorks.map((item, index) => (
              <div key={item.step} className="relative flex gap-6 pb-10 last:pb-0">
                {index < howItWorks.length - 1 && (
                  <div className="absolute left-6 top-14 h-full w-px bg-border" />
                )}
                <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground">
                  {item.step}
                </div>
                <div className="pt-2">
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Need */}
      <section className="py-16">
        <div className="container">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-center font-display text-2xl font-bold text-foreground md:text-3xl">
              What We Look For
            </h2>
            <div className="mt-8 space-y-4">
              {[
                "Dedicated desks, private cabins, or managed office spaces",
                "Professional infrastructure and amenities",
                "Clear pricing structure (even if final quote is negotiable)",
                "Responsive to enquiries and site visit requests",
                "Located in Delhi NCR",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <BadgeCheck className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                  <span className="text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Transparency */}
      <section className="bg-muted/30 py-16">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-xl font-semibold text-foreground">
              Our Partner Fee Model
            </h2>
            <p className="mt-4 text-muted-foreground">
              We operate on a success-based model. You pay a partner fee only when a client we refer actually books with you.
              No listing fees. No monthly charges. We succeed only when you do.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Partner fee percentage discussed during onboarding based on space type and terms.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container text-center">
          <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
            Ready to List Your Space?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Get in touch and we'll walk you through the process.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button variant="whatsapp" size="lg" asChild>
              <a href={partnerWhatsApp} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-5 w-5" />
                WhatsApp Us
              </a>
            </Button>
            <Button variant="outline" size="lg" onClick={() => handleEmailClick("Partnership Enquiry")}>
              <Mail className="h-5 w-5" />
              Email: {contactConfig.email}
            </Button>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}
