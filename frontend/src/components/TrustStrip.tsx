import { BadgeCheck, Clock, Shield, MessageCircle } from "lucide-react";

const trustPoints = [
  {
    icon: BadgeCheck,
    title: "Verified Spaces",
    description: "Every listing is personally verified",
  },
  {
    icon: Shield,
    title: "No Customer Fees",
    description: "You pay nothing to Kosmix",
  },
  {
    icon: Clock,
    title: "24hr Response",
    description: "Quick turnaround on enquiries",
  },
  {
    icon: MessageCircle,
    title: "Expert Guidance",
    description: "We help you find the right fit",
  },
];

export function TrustStrip() {
  return (
    <div className="border-y border-border bg-muted/30 py-8">
      <div className="container">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {trustPoints.map((point) => (
            <div key={point.title} className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <point.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground">{point.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{point.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
