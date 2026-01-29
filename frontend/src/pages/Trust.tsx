import { Link } from "react-router-dom";
import { BadgeCheck, Shield, Eye, Clock, Users, MessageCircle, FileText, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FAQAccordion } from "@/components/FAQAccordion";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { transparencyLines } from "@/config/contact";
import { SEO } from "@/components/SEO";

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
    description: "We respond to every enquiry within 3 hours. WhatsApp us for even faster assistance – it's our most responsive channel.",
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

export default function Trust() {
  return (
    <>
      <SEO
        title="Trust & Safety - Verified Workspaces | Kosmix Spaces"
        description="Learn about our verification process, privacy protection, and commitment to transparency. Every workspace is personally verified. No hidden fees."
        keywords={[
          "verified coworking",
          "trusted workspace",
          "safe coworking space",
          "verified listings",
          "no hidden fees"
        ]}
        canonical="https://kosmixspaces.in/trust"
      />
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

      {/* Testimonials */}
      <section className="bg-muted/30 py-16">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
              What Our Partners Say
            </h2>
            <p className="mt-3 text-muted-foreground">
              A few words from leaders we&apos;ve worked with across hospitality, technology, and coworking.
            </p>
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure
                key={t.name}
                className="flex h-full flex-col justify-between rounded-xl border border-border bg-card p-6 text-left"
              >
                <blockquote className="text-sm text-muted-foreground leading-relaxed">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-4 pt-4 border-t border-border/60 text-sm">
                  <p className="font-semibold text-foreground">{t.name}</p>
                  <p className="text-muted-foreground">{t.title}</p>
                  <p className="text-muted-foreground">{t.company}</p>
                </figcaption>
              </figure>
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
    </>
  );
}
