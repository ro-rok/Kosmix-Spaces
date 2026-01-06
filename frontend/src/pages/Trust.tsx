import { Link } from "react-router-dom";
import { BadgeCheck, Shield, Eye, Clock, Users, MessageCircle, FileText, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FAQAccordion } from "@/components/FAQAccordion";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { transparencyLines } from "@/config/contact";

const trustPillars = [
  {
    icon: BadgeCheck,
    title: "Verified Listings",
    description: "Every space marked 'Verified' has been personally visited by our team. We check infrastructure, amenities, legal compliance, and terms before approval.",
  },
  {
    icon: Shield,
    title: "No Hidden Fees",
    description: "You pay nothing to Kosmix Spaces. We're transparent about our business model – if you book through us, we may earn a commission from the workspace partner.",
  },
  {
    icon: Eye,
    title: "Privacy Protected",
    description: "We don't share exact addresses until you're ready for a site visit. This protects both you and our workspace partners from unsolicited contact.",
  },
  {
    icon: Clock,
    title: "Responsive Support",
    description: "We respond to every enquiry within 24 hours. WhatsApp us for even faster assistance – it's our most responsive channel.",
  },
];

const commitments = [
  {
    icon: FileText,
    title: "Accurate Information",
    description: "We regularly update listings to ensure information is current. Budget bands, availability, and amenities are verified.",
  },
  {
    icon: Users,
    title: "No Pressure",
    description: "We provide guidance, not pushy sales tactics. Our goal is to help you find the right fit, not just close a deal.",
  },
  {
    icon: Lock,
    title: "Data Security",
    description: "Your enquiry information is handled securely and only shared with relevant workspace partners when you request contact.",
  },
];

export default function Trust() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-accent/5 py-16 md:py-24">
        <div className="container text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold text-foreground md:text-5xl">
            Trust & Safety
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            How we ensure a safe, transparent, and reliable experience
            for everyone using Kosmix Spaces.
          </p>
        </div>
      </section>

      {/* Trust Pillars */}
      <section className="py-16">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-2">
            {trustPillars.map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <pillar.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-muted-foreground leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Transparency Box */}
      <section className="bg-muted/30 py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
              Our Business Model
            </h2>
            <div className="mt-8 rounded-xl border border-border bg-card p-8">
              <p className="text-lg text-foreground">
                {transparencyLines.partnerFee}
              </p>
              <p className="mt-4 text-muted-foreground">
                This means we're motivated to help you find the right workspace – not just any workspace.
                We earn only when you're satisfied enough to book.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Commitments */}
      <section className="py-16">
        <div className="container">
          <h2 className="text-center font-display text-2xl font-bold text-foreground md:text-3xl">
            Our Commitments
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {commitments.map((item) => (
              <div key={item.title} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 font-display font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/30 py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center font-display text-2xl font-bold text-foreground md:text-3xl">
              Frequently Asked Questions
            </h2>
            <div className="mt-8">
              <FAQAccordion />
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16">
        <div className="container text-center">
          <h2 className="font-display text-2xl font-bold text-foreground">
            Have Concerns?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            We're always here to help. Reach out with any questions or concerns about our service.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button variant="whatsapp" size="lg" asChild>
              <a href={buildWhatsAppLink()} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-5 w-5" />
                WhatsApp Us
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/contact">Contact Form</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
