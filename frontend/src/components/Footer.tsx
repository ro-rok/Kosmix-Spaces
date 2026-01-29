import { Link } from "react-router-dom";
import { MessageCircle, Phone, Mail, MapPin } from "lucide-react";
import { Logo } from "@/components/Logo";
import { contactConfig, transparencyLines } from "@/config/contact";
import { buildWhatsAppLink, buildCallLink } from "@/lib/whatsapp";
import { handleEmailClick } from "@/lib/email";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      {/* Transparency Strip */}
      <div className="bg-primary/5 py-4">
        <div className="container text-center">
          <p className="text-sm text-muted-foreground">
            {transparencyLines.partnerFee}
          </p>
        </div>
      </div>

      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <Logo size="medium" showFallbackText />
              <span className="font-display text-lg font-bold">
                Kosmix<span className="text-primary">Spaces</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Find verified workspaces in Delhi. No customer fees.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Delhi, India</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-display font-semibold text-foreground">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/explore" className="text-sm text-muted-foreground hover:text-primary">
                  Explore Spaces
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-sm text-muted-foreground hover:text-primary">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/trust" className="text-sm text-muted-foreground hover:text-primary">
                  Trust & Safety
                </Link>
              </li>
              <li>
                <Link to="/partners" className="text-sm text-muted-foreground hover:text-primary">
                  For Partners
                </Link>
              </li>
            </ul>
          </div>

          {/* Space Types */}
          <div className="space-y-4">
            <h4 className="font-display font-semibold text-foreground">Space Types</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/explore?type=dedicated-desk" className="text-sm text-muted-foreground hover:text-primary">
                  Dedicated Desks
                </Link>
              </li>
              <li>
                <Link to="/explore?type=private-cabin" className="text-sm text-muted-foreground hover:text-primary">
                  Private Cabins
                </Link>
              </li>
              <li>
                <Link to="/explore?type=managed-office" className="text-sm text-muted-foreground hover:text-primary">
                  Managed Offices
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-display font-semibold text-foreground">Get in Touch</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href={buildWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-whatsapp"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp Us
                </a>
              </li>
              <li>
                <a
                  href={buildCallLink()}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-call"
                >
                  <Phone className="h-4 w-4" />
                  {contactConfig.phoneNumber}
                </a>
              </li>
              <li>
                <button
                  onClick={() => handleEmailClick()}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                >
                  <Mail className="h-4 w-4" />
                  {contactConfig.email}
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {contactConfig.companyName}. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link to="/trust" className="text-xs text-muted-foreground hover:text-primary">
              Privacy Policy
            </Link>
            <Link to="/trust" className="text-xs text-muted-foreground hover:text-primary">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
