import { MessageCircle, Phone, Mail, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnquiryForm } from "@/components/EnquiryForm";
import { buildWhatsAppLink, buildCallLink, buildEmailLink } from "@/lib/whatsapp";
import { contactConfig, transparencyLines } from "@/config/contact";

export default function Contact() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-accent/5 py-16 md:py-20">
        <div className="container text-center">
          <h1 className="font-display text-3xl font-bold text-foreground md:text-5xl">
            Get in Touch
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Looking for workspace? Have questions? We're here to help.
            <br />
            WhatsApp is our fastest channel.
          </p>
        </div>
      </section>

      {/* Contact Methods + Form */}
      <section className="py-16">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Contact Info */}
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                Contact Information
              </h2>
              <p className="mt-2 text-muted-foreground">
                Reach out through any of these channels. We respond within 3 hours.
              </p>
              <div className="mt-4 rounded-xl bg-muted/40 p-4 text-sm text-left">
                <p className="font-semibold text-foreground">Primary Contact</p>
                <p className="mt-1 text-foreground">Swati Kapoor, Founder – Kosmix Spaces</p>
                <p className="mt-1 text-muted-foreground">
                  Phone: <span className="font-medium">{contactConfig.phoneNumber}</span>
                </p>
                <p className="mt-0.5 text-muted-foreground">
                  Email:{" "}
                  <a
                    href={buildEmailLink()}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {contactConfig.email}
                  </a>
                </p>
              </div>

              <div className="mt-8 space-y-6">
                {/* WhatsApp */}
                <a
                  href={buildWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-whatsapp/50 hover:bg-whatsapp/5"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-whatsapp/10">
                    <MessageCircle className="h-6 w-6 text-whatsapp" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">WhatsApp</p>
                    <p className="text-sm text-muted-foreground">Fastest response channel</p>
                    <p className="mt-1 text-sm font-medium text-whatsapp">Click to chat →</p>
                  </div>
                </a>

                {/* Phone */}
                <a
                  href={buildCallLink()}
                  className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-call/50 hover:bg-call/5"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-call/10">
                    <Phone className="h-6 w-6 text-call" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Phone</p>
                    <p className="text-sm text-muted-foreground">Call us directly</p>
                    <p className="mt-1 text-sm font-medium text-call">{contactConfig.phoneNumber}</p>
                  </div>
                </a>

                {/* Email */}
                <a
                  href={buildEmailLink()}
                  className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50 hover:bg-primary/5"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Email</p>
                    <p className="text-sm text-muted-foreground">For detailed enquiries</p>
                    <p className="mt-1 text-sm font-medium text-primary">{contactConfig.email}</p>
                  </div>
                </a>
              </div>

              {/* Additional Info */}
              <div className="mt-8 space-y-4 rounded-xl bg-muted/50 p-6">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <span className="text-foreground">Delhi, India</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span className="text-foreground">Response within 3 hours</span>
                </div>
              </div>

              {/* Transparency */}
              <p className="mt-6 text-sm text-muted-foreground">
                {transparencyLines.partnerFee}
              </p>
            </div>

            {/* Enquiry Form */}
            <div>
              <div className="rounded-xl border border-border bg-card p-6 md:p-8">
                <h2 className="font-display text-xl font-semibold text-foreground">
                  Submit an Enquiry
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Tell us what you're looking for and we'll get back to you.
                </p>
                <div className="mt-6">
                  <EnquiryForm source="contact-page" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Strip */}
      <section className="border-t border-border bg-muted/30 py-12">
        <div className="container text-center">
          <p className="text-muted-foreground">
            Prefer a quick chat? WhatsApp is our fastest channel.
          </p>
          <Button variant="whatsapp" size="lg" className="mt-4" asChild>
            <a href={buildWhatsAppLink()} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-5 w-5" />
              Start WhatsApp Chat
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}
