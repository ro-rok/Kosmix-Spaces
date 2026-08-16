// ─────────────────────────────────────────────────────────────────────────────
// DEV-ONLY TEST BLOG — never touches the database, never ships to production.
//
// `import.meta.env.DEV` is statically replaced by Vite at build time:
//   • dev server  → true  → Blog pages serve the mock content below
//   • `vite build` → false → this module is dead code and tree-shaken away
//
// To force-disable the mock even in dev, temporarily set
// `const TEST_BLOG_ENABLED = false;` below.
// ─────────────────────────────────────────────────────────────────────────────

export const TEST_BLOG_ENABLED = import.meta.env.DEV;

// Real workspace photography already served by Kosmix (Cloudinary) so the
// test post looks exactly like a live article.
const IMG = {
  officeLead:
    "https://res.cloudinary.com/dukcek7k1/image/upload/v1782466356/root/kosmixspaces/partners/6a3e44a84ab9199dca1d604f/private-offices/kpxnnvkaynk9ljqhccch.jpg",
  meetingRoom:
    "https://res.cloudinary.com/dukcek7k1/image/upload/v1782468194/root/kosmixspaces/partners/6a3e44a84ab9199dca1d604f/meeting-rooms/dbqksrmdmrwuvtgo5lk9.jpg",
  hotDesk:
    "https://res.cloudinary.com/dukcek7k1/image/upload/v1782468778/root/kosmixspaces/partners/6a3e44a84ab9199dca1d604f/hot-desks/oytyaup94fkgr5keh1zv.jpg",
  dedicatedDesk:
    "https://res.cloudinary.com/dukcek7k1/image/upload/v1782468406/root/kosmixspaces/partners/6a3e44a84ab9199dca1d604f/dedicated-desks/u4cnpjmb2yi4mm9xexfb.jpg",
};

const uid = () => Math.random().toString(36).slice(2, 10);

// ─── The featured test article ───────────────────────────────────────────────

export const TEST_POST_SLUG = "inside-nehru-place-delhi-workspaces";

const testPost = {
  blogId: "test-blog-nehru-place",
  title: "Inside Nehru Place: Why Delhi's Startup Scene Is Coming Home",
  excerpt:
    "Once the domain of hardware bazaars and grey-market electronics, Nehru Place has quietly become one of Delhi's most practical addresses for a young company. We walked the towers, priced the desks, and asked founders why they're moving back to the centre.",
  slug: TEST_POST_SLUG,
  featuredImage: {
    url: IMG.officeLead,
    publicId: "test/office-lead",
    altText: "Private office interior in Nehru Place, Delhi",
    caption: "A private office floor in Nehru Place, Delhi",
    width: 1200,
    height: 800,
  },
  contentBlocks: [
    {
      id: uid(),
      type: "heading",
      content: "The reinvention of a concrete landmark",
    },
    {
      id: uid(),
      type: "paragraph",
      content:
        "Nehru Place has always been Delhi's most literal business district — a clutch of concrete towers built on the premise that if you put enough companies in one place, the city will follow. For decades it did, in the form of computer repair shops and cable wholesalers. Today the towers are filling with something quieter: product teams, design studios, and two-person startups that outgrew a café table.",
    },
    {
      id: uid(),
      type: "quote",
      content:
        "We looked at Gurugram for a week. Then we remembered what it costs to get a client to commute to your office twice a month. Nehru Place is ten minutes from the metro and the pricing is still sane.",
    },
    {
      id: uid(),
      type: "paragraph",
      content:
        "The numbers explain the shift. A dedicated desk in a Nehru Place centre runs roughly ₹10,000–15,000 a month, a private cabin for a five-person team ₹20,000–35,000, and most centres offer day passes for meetings and interviews. Compared with comparable Grade-A space in Cyber City or BKC, that's often half the burn for the same commute time from South and Central Delhi.",
    },
    {
      id: uid(),
      type: "subheading",
      content: "What you actually pay in 2026",
    },
    {
      id: uid(),
      type: "list",
      listItems: [
        "Hot desk — ₹6,000–9,000 per month, usually includes WiFi, tea, and meeting-room credits",
        "Dedicated desk — ₹10,000–15,000 per month with a locker and 24/7 card access at most centres",
        "Private office — ₹20,000–35,000 per month for 4–6 seats, flexible lock-in from 3 months",
        "Meeting rooms — ₹300–800 per hour, often discounted for members",
      ],
    },
    {
      id: uid(),
      type: "image",
      image: {
        url: IMG.meetingRoom,
        publicId: "test/meeting-room",
        altText: "Meeting room inside a Nehru Place coworking centre",
        caption: "A member meeting room in a Nehru Place centre",
        width: 1197,
        height: 800,
      },
    },
    {
      id: uid(),
      type: "subheading",
      content: "The 20-point checklist before you sign",
    },
    {
      id: uid(),
      type: "paragraph",
      content:
        "The best way to compare centres is to stop treating them like apartments. Every Kosmix-listed space is verified against a 20-point checklist before it goes live — power backup, elevator timings, internet redundancy, access hours, and guest policy included — so what you see on the listing is what the salesperson has to defend in person.",
    },
    {
      id: uid(),
      type: "list",
      listItems: [
        "Confirm access hours and weekend policy before you negotiate the rate",
        "Ask for the internet provider and the actual committed bandwidth, not the advertised speed",
        "Visit at 6 PM once — the building's lift queue tells you more than the tour",
        "Check whether meeting-room credits are monthly or one-time at signup",
      ],
    },
    {
      id: uid(),
      type: "paragraph",
      content:
        "The neighbourhood still surprises. The rooftop cafés have caught up with the towers, the metro station empties into the main plaza, and the evening crowd is half professionals now. If your team is in Delhi, the centre of the city has quietly become the easiest place to hire from — and the lease math finally works.",
    },
  ],
  categories: ["Workspace Guides", "Delhi"],
  tags: ["coworking", "nehru place", "delhi", "startups"],
  publishedAt: new Date().toISOString(),
  wordCount: 480,
  readingTime: 3,
  isFeatured: true,
  allowComments: true,
  seoMetadata: {
    metaTitle: "Inside Nehru Place: Why Delhi's Startup Scene Is Coming Home",
    metaDescription:
      "A founder's guide to coworking and private offices in Nehru Place, Delhi — real prices, verification checklist, and why teams are moving back to the centre.",
    keywords: ["nehru place", "coworking delhi", "private office", "startup"],
    ogTitle: "Inside Nehru Place: Why Delhi's Startup Scene Is Coming Home",
    ogDescription:
      "Real prices, a 20-point verification checklist, and the case for the centre of Delhi.",
    canonicalUrl: "",
  },
  associatedWorkspaces: [
    {
      workspaceId: "test-ws-classic-converge",
      displayName: "Classic Converge",
      slug: "/listing/classic-converge/nehru-place/classic-converge",
      locality: "Nehru Place",
      city: "Delhi",
      workspaceImages: [
        {
          url: IMG.officeLead,
          publicId: "test/classic-converge",
          altText: "Classic Converge private office",
          caption: "",
          width: 1200,
          height: 800,
        },
      ],
    },
  ],
};

// ─── Two supporting cards so the listing page grid looks complete ───────────

const supportPosts = [
  {
    blogId: "test-blog-cost-comparison",
    title: "Coworking vs Private Office: The 2026 Cost Comparison",
    excerpt:
      "Hot desk, dedicated desk, or a cabin for your team — we break down what each actually costs across Delhi's major business districts.",
    slug: "coworking-vs-private-office-2026",
    featuredImage: {
      url: IMG.hotDesk,
      publicId: "test/hot-desk",
      altText: "Hot desks in a Delhi coworking space",
      caption: "",
      width: 1063,
      height: 800,
    },
    categories: ["Workspace Guides"],
    tags: ["pricing", "coworking"],
    publishedAt: new Date(Date.now() - 3 * 86400_000).toISOString(),
    wordCount: 410,
    readingTime: 3,
    isFeatured: false,
    associatedWorkspaces: [],
  },
  {
    blogId: "test-blog-verification",
    title: "The 20-Point Verification Checklist Behind Every Kosmix Space",
    excerpt:
      "Power backup, elevator timings, internet redundancy, guest policy — here's exactly what we check before a workspace goes live.",
    slug: "kosmix-20-point-verification-checklist",
    featuredImage: {
      url: IMG.dedicatedDesk,
      publicId: "test/dedicated-desk",
      altText: "Dedicated desk setup in a verified workspace",
      caption: "",
      width: 1063,
      height: 800,
    },
    categories: ["Trust & Safety"],
    tags: ["verification", "trust"],
    publishedAt: new Date(Date.now() - 7 * 86400_000).toISOString(),
    wordCount: 360,
    readingTime: 2,
    isFeatured: false,
    associatedWorkspaces: [],
  },
];

const ALL_POSTS = [testPost, ...supportPosts];

// ─── Mock API surface (mirrors api.blog) ─────────────────────────────────────

export const testBlog = {
  getBlogs: (params: { page?: number; limit?: number } = {}) => {
    const page = params.page ?? 1;
    const limit = params.limit ?? 9;
    const start = (page - 1) * limit;
    return Promise.resolve({
      blogs: ALL_POSTS.slice(start, start + limit),
      total: ALL_POSTS.length,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(ALL_POSTS.length / limit)),
    });
  },

  getCategories: () =>
    Promise.resolve([
      { name: "Workspace Guides", count: 2 },
      { name: "Delhi", count: 1 },
      { name: "Trust & Safety", count: 1 },
    ]),

  getPost: (slug: string) => {
    const post = ALL_POSTS.find((p) => p.slug === slug);
    return Promise.resolve(post as typeof testPost | undefined);
  },
};
