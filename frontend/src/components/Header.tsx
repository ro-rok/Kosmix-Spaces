import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { buildWhatsAppLink, buildCallLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/explore", label: "Explore Spaces" },
  { href: "/blog", label: "Blog" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/trust", label: "Trust & Safety" },
  { href: "/partners", label: "For Partners" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [overCinematic, setOverCinematic] = useState(isHome);

  useEffect(() => {
    if (!isHome) {
      setOverCinematic(false);
      return;
    }

    setOverCinematic(true);
    let observer: IntersectionObserver | null = null;
    let raf = 0;

    const attach = () => {
      const el = document.querySelector("[data-cinematic-hero]");
      if (!el) {
        raf = requestAnimationFrame(attach);
        return;
      }
      observer = new IntersectionObserver(
        ([entry]) => setOverCinematic(entry.isIntersecting),
        { threshold: 0.12 }
      );
      observer.observe(el);
    };

    attach();
    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
    };
  }, [isHome, location.pathname]);

  const cinematicNav = isHome && overCinematic && !mobileMenuOpen;

  return (
    <header
      className={cn(
        "z-50 transition-[background-color,box-shadow,border-radius,width,top] duration-500",
        isHome
          ? cn(
              "fixed inset-x-0 mx-auto",
              cinematicNav
                ? "top-0 w-full max-w-none rounded-none border-transparent bg-gradient-to-b from-black/55 via-black/20 to-transparent shadow-none backdrop-blur-0"
                : "top-3 w-[calc(100%-24px)] max-w-[1440px] rounded-2xl border border-border/60 bg-card/90 shadow-md backdrop-blur-md"
            )
          : "sticky top-3 mx-auto w-[calc(100%-24px)] max-w-[1440px] rounded-2xl border border-border/60 bg-card/90 shadow-md backdrop-blur-md"
      )}
    >
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <Logo
            size="medium"
            showFallbackText
            className={cinematicNav ? "brightness-0 invert" : undefined}
          />
          <span
            className={cn(
              "font-display text-lg font-bold tracking-tight",
              cinematicNav ? "text-white" : "text-foreground"
            )}
          >
            Kosmix<span className="text-primary">Spaces</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "text-[13px] font-medium tracking-[-0.01em] transition-colors hover:text-primary",
                location.pathname === link.href || location.pathname.startsWith(link.href + "/")
                  ? "text-primary"
                  : cinematicNav
                    ? "text-white/80"
                    : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="whatsapp"
            size="sm"
            className="hidden sm:inline-flex"
            asChild
          >
            <a href={buildWhatsAppLink()} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden md:inline">WhatsApp</span>
            </a>
          </Button>
          <Button variant="call" size="sm" className="hidden sm:inline-flex" asChild>
            <a href={buildCallLink()}>
              <Phone className="h-4 w-4" />
              <span className="hidden md:inline">Call</span>
            </a>
          </Button>
          <Button
            variant="default"
            size="sm"
            className="hidden md:inline-flex"
            asChild
          >
            <Link to="/partner/login">Partner Login</Link>
          </Button>
          <ThemeToggle lightOnDark={cinematicNav} />

          <Button
            variant="ghost"
            size="icon"
            className={cn("lg:hidden", cinematicNav && "text-white hover:bg-white/10 hover:text-white")}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-border/60 bg-card rounded-b-2xl lg:hidden">
          <nav className="container flex flex-col gap-1 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                  location.pathname === link.href || location.pathname.startsWith(link.href + "/")
                    ? "bg-primary-light/50 text-primary"
                    : "text-foreground hover:bg-accent/50"
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-2 px-4">
              <Button variant="outline" size="sm" asChild>
                <Link to="/partner/login" onClick={() => setMobileMenuOpen(false)}>
                  Partner Login
                </Link>
              </Button>
              <div className="flex gap-2">
                <Button variant="whatsapp" size="sm" className="flex-1" asChild>
                  <a href={buildWhatsAppLink()} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                </Button>
                <Button variant="call" size="sm" className="flex-1" asChild>
                  <a href={buildCallLink()}>
                    <Phone className="h-4 w-4" />
                    Call
                  </a>
                </Button>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
