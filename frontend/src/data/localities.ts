export interface Locality {
  id: string;
  name: string;
  city: string;
  popular: boolean;
}

export const localities: Locality[] = [
  { id: "connaught-place", name: "Connaught Place", city: "Delhi", popular: true },
  { id: "saket", name: "Saket", city: "Delhi", popular: true },
  { id: "nehru-place", name: "Nehru Place", city: "Delhi", popular: true },
  { id: "okhla", name: "Okhla", city: "Delhi", popular: true },
  { id: "janakpuri", name: "Janakpuri", city: "Delhi", popular: false },
  { id: "dwarka", name: "Dwarka", city: "Delhi", popular: true },
  { id: "vasant-kunj", name: "Vasant Kunj", city: "Delhi", popular: false },
  { id: "lajpat-nagar", name: "Lajpat Nagar", city: "Delhi", popular: false },
  { id: "karol-bagh", name: "Karol Bagh", city: "Delhi", popular: true },
  { id: "pitampura", name: "Pitampura", city: "Delhi", popular: false },
  { id: "rohini", name: "Rohini", city: "Delhi", popular: false },
  { id: "greater-kailash", name: "Greater Kailash", city: "Delhi", popular: true },
  { id: "south-extension", name: "South Extension", city: "Delhi", popular: false },
  { id: "hauz-khas", name: "Hauz Khas", city: "Delhi", popular: true },
  { id: "green-park", name: "Green Park", city: "Delhi", popular: false },
];

export const popularLocalities = localities.filter(l => l.popular);
