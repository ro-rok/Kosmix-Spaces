import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { transparencyLines } from "@/config/contact";

const faqs = [
  {
    question: "How does Kosmix Spaces work?",
    answer:
      "We help you find verified workspaces in Delhi. Browse our listings, shortlist spaces, and reach out via WhatsApp or call. We'll schedule visits and help you negotiate. No fees for customers.",
  },
  {
    question: "Do I have to pay Kosmix any fees?",
    answer: transparencyLines.partnerFee,
  },
  {
    question: "Why don't you show exact addresses?",
    answer: transparencyLines.addressHiding,
  },
  {
    question: "How are prices determined?",
    answer:
      "All pricing is on enquiry. " + transparencyLines.budgetDisclaimer + " We help you get the best deal.",
  },
  {
    question: "What types of spaces do you offer?",
    answer:
      "We focus on Dedicated Desks, Private Cabins, and Managed Offices. Meeting rooms are available as add-ons at some locations. We don't offer day passes.",
  },
  {
    question: "How quickly will you respond?",
    answer:
      "We aim to respond within 24 hours. For faster assistance, reach out on WhatsApp – it's our fastest channel.",
  },
  {
    question: "How do I know a space is verified?",
    answer:
      "Spaces marked with a 'Verified' badge have been personally visited and vetted by our team. We check infrastructure, amenities, and terms before verification.",
  },
  {
    question: "Can I schedule a site visit?",
    answer:
      "Absolutely! Submit an enquiry with your preferred dates and times, or WhatsApp us directly. We'll coordinate with the workspace to arrange your visit.",
  },
];

export function FAQAccordion() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {faqs.map((faq, index) => (
        <AccordionItem key={index} value={`item-${index}`}>
          <AccordionTrigger className="text-left font-display text-base font-medium">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
