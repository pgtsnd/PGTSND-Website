export interface CaseStudyData {
  slug: string;
  client: string;
  title: string;
  subtitle: string;
  heroImage: string;
  testimonial: {
    quote: string;
    author: string;
    logo?: string;
  };
  sectionTitle: string;
  paragraphs: string[];
  gallery: string[];
}

const caseStudies: CaseStudyData[] = [
  {
    slug: "vallation-outerwear",
    client: "Vallation Outerwear",
    title: "Vallation Outerwear X PGTSND",
    subtitle: "A Photography Partnership",
    heroImage: "/images/case-studies/vallation-outerwear/pgtsnd-vallation-outerwear-photography-19.jpeg",
    testimonial: {
      quote: "When we decided we needed more photos of our gear in its element in commercial fishing we reached out to Bri at PGTSND Productions. Their prior work and experience within commercial fishing made our choice easy.",
      author: "Cory Jackson, Vallation Outerwear",
      logo: "/images/case-studies/vallation-outerwear/vallation-outerwear-logo.png",
    },
    sectionTitle: "Inside Our Partnership",
    paragraphs: [
      "Capturing the brand at work in its natural element was the goal.",
      "By taking to the open water for a lifestyle-focused photoshoot, we showcased their gear in the conditions it was built for.",
      "The resulting gallery gave Vallation a versatile library of professional images, ready to be used across their website, print materials, point-of-sale displays, and social media content.",
      "The strength of these visuals creates consistency, elevates brand presence, and extends the life of every marketing effort. With this shoot, Vallation gained photography that works as hard as their outerwear does.",
    ],
    gallery: [
      "/images/case-studies/vallation-outerwear/pgtsnd-vallation-outerwear-photography-18.jpeg",
      "/images/case-studies/vallation-outerwear/pgtsnd-vallation-outerwear-photography-3.jpeg",
      "/images/case-studies/vallation-outerwear/pgtsnd-vallation-outerwear-photography-12.jpeg",
      "/images/case-studies/vallation-outerwear/pgtsnd-vallation-outerwear-photography-4.jpeg",
      "/images/case-studies/vallation-outerwear/pgtsnd-vallation-outerwear-photography-6.jpeg",
      "/images/case-studies/vallation-outerwear/pgtsnd-vallation-outerwear-photography-7.jpeg",
      "/images/case-studies/vallation-outerwear/pgtsnd-vallation-outerwear-photography-9.jpeg",
      "/images/case-studies/vallation-outerwear/pgtsnd-vallation-outerwear-photography-10.jpeg",
      "/images/case-studies/vallation-outerwear/pgtsnd-vallation-outerwear-photography-2.jpeg",
    ],
  },
  {
    slug: "alaska-bering-sea-crabbers",
    client: "Alaska Bering Sea Crabbers",
    title: "Alaska Bering Sea Crabbers X PGTSND",
    subtitle: "A Visual Campaign",
    heroImage: "/images/case-studies/absc/ABSC-200.jpg",
    testimonial: {
      quote: "PGTSND has been instrumental in telling the story of our fishermen and the sustainable practices that define Alaska's crab fisheries. Their work captures the grit and dedication of our industry.",
      author: "Jamie Goen, Alaska Bering Sea Crabbers",
      logo: "/images/case-studies/absc/Jamie-Goen-Alaska-Bering-Sea-Crabbers-pgt-snd.jpg",
    },
    sectionTitle: "Inside Our Partnership",
    paragraphs: [
      "Alaska Bering Sea Crabbers needed a comprehensive visual campaign to support their advocacy and public awareness efforts.",
      "We traveled to Dutch Harbor to document the real people and real work behind one of the world's most demanding fisheries.",
      "The resulting content spanned photography, social media assets, web design, and branded materials — giving ABSC a cohesive visual identity that communicates the value and sustainability of their industry.",
      "From social graphics to on-the-water photography, every deliverable was designed to build public trust and industry pride.",
    ],
    gallery: [
      "/images/case-studies/absc/pgtsnd-ABSC-photography-1.jpeg",
      "/images/case-studies/absc/pgtsnd-ABSC-photography-2.jpeg",
      "/images/case-studies/absc/pgtsnd-ABSC-photography-3.jpg",
      "/images/case-studies/absc/pgtsnd-ABSC-photography-4.jpeg",
      "/images/case-studies/absc/pgtsnd-ABSC-photography-5.jpeg",
      "/images/case-studies/absc/pgtsnd-ABSC-photography-6.jpeg",
      "/images/case-studies/absc/pgtsnd-ABSC-photography-7.jpeg",
      "/images/case-studies/absc/pgtsnd-ABSC-photography-8.jpeg",
    ],
  },
  {
    slug: "green-juju",
    client: "Green Juju",
    title: "Green Juju X PGTSND",
    subtitle: "Full Production Suite +",
    heroImage: "/images/case-studies/green-juju/green-juju-dog-kitchen-pgtsnd.jpeg",
    testimonial: {
      quote: "Bri and her team have completely transformed our digital presence, and the difference has been remarkable. Their understanding of our brand and audience has made all the difference.",
      author: "Kelly Marian, Green Juju",
      logo: "/images/case-studies/green-juju/kelly-green-juju.webp",
    },
    sectionTitle: "Inside Our Partnership",
    paragraphs: [
      "Green Juju came to PGTSND looking for a complete overhaul of their visual identity and digital presence.",
      "We developed a full suite of photography, video, social media content, and web design that reflects their mission of providing whole-food nutrition for pets.",
      "From product photography and lifestyle shoots to animated social graphics and a fully redesigned website, every asset was built to work together.",
      "The result is a cohesive brand presence that connects with pet owners and communicates Green Juju's commitment to quality ingredients.",
    ],
    gallery: [
      "/images/case-studies/green-juju/green-juju-ingredients-pgt-snd-bri-dwyer.jpeg",
      "/images/case-studies/green-juju/founder-farm-green-juju-pgtsnd-bri-dwyer.jpg",
      "/images/case-studies/green-juju/pets-green-juju-pgtsnd-bri-dwyer.jpeg",
      "/images/case-studies/green-juju/puppies-green-juju-pgtsnd.jpeg",
      "/images/case-studies/green-juju/green-juju-supplements-close-pgtsnd.jpeg",
      "/images/case-studies/green-juju/green-juju-ingredientspgtsnd-photography.jpeg",
      "/images/case-studies/green-juju/green-juju-vitality-blend-pgtsnd.jpeg",
    ],
  },
  {
    slug: "net-your-problem",
    client: "Net Your Problem",
    title: "Net Your Problem X PGTSND",
    subtitle: "Brand Film Production",
    heroImage: "/images/case-studies/net-your-problem/net-your-problem-pgt-snd-photography-1.jpeg",
    testimonial: {
      quote: "The films we have created with PGTSND have been remarkably useful for us at conferences and in helping to recruit new partners. Their ability to capture our technology in action has been invaluable.",
      author: "Nicole Baker, Net Your Problem",
      logo: "/images/nicole-baker-pgtsnd.jpg",
    },
    sectionTitle: "Inside Our Partnership",
    paragraphs: [
      "Net Your Problem needed compelling video assets to present at industry conferences and help recruit new partners.",
      "We spent time on the water with their team, capturing the real work behind their fishing technology innovation.",
      "The resulting brand films showcase both the problem their product solves and the people behind the solution.",
      "These films have become a cornerstone of Net Your Problem's conference presentations and partner recruitment efforts.",
    ],
    gallery: [
      "/images/case-studies/net-your-problem/net-your-progblem-pgtsnd-photography-2.jpeg",
      "/images/case-studies/net-your-problem/net-your-problem-pgt-snd-photography-4.jpeg",
      "/images/case-studies/net-your-problem/net-your-problem-pgt-snd-photography-5.jpeg",
      "/images/case-studies/net-your-problem/net-your-problem-pgtsnd-photography-6.jpeg",
      "/images/case-studies/net-your-problem/net-your-problem-pgtsnd-photography-7.jpeg",
      "/images/case-studies/net-your-problem/net-your-problem-pgtsnd-photography-8.jpeg",
      "/images/case-studies/net-your-problem/net-your-problem-pgtsnd-photgraphy-9.jpeg",
    ],
  },
  {
    slug: "lodge-58-north",
    client: "Lodge @ 58 North",
    title: "Lodge @ 58 North X PGTSND",
    subtitle: "Video Production | Photography",
    heroImage: "/images/case-studies/lodge-58-north/lodge-58-north-pgtsnd-photography-1.jpeg",
    testimonial: {
      quote: "PGTSND captured the essence of our lodge and the experiences we offer in a way that truly resonates with our guests. The photography and video work has elevated how we present ourselves to the world.",
      author: "Lodge @ 58 North",
    },
    sectionTitle: "Inside Our Partnership",
    paragraphs: [
      "Lodge @ 58 North needed photography and video production that could capture the full scope of the guest experience.",
      "From the rugged beauty of the surrounding landscape to the warmth of the lodge itself, every frame was designed to tell the story of what makes this destination unique.",
      "We delivered a comprehensive library of images and video content ready for web, social media, and print marketing.",
      "The resulting visuals transport viewers directly into the experience, building anticipation and driving bookings.",
    ],
    gallery: [
      "/images/case-studies/lodge-58-north/lodge-58-north-pgtsnd-photography-2.jpeg",
      "/images/case-studies/lodge-58-north/lodge-58-north-pgtsnd-photography-3.jpeg",
      "/images/case-studies/lodge-58-north/lodge-58-north-pgtsnd-photography-4.jpeg",
      "/images/case-studies/lodge-58-north/lodge-58-north-pgtsnd-photography-5.jpeg",
      "/images/case-studies/lodge-58-north/lodge-58-north-pgtsnd-photography-6.jpeg",
      "/images/case-studies/lodge-58-north/lodge-58-north-pgtsnd-photography-7.jpeg",
      "/images/case-studies/lodge-58-north/lodge-58-north-pgtsnd-photography-8.jpeg",
      "/images/case-studies/lodge-58-north/lodge-58-north-pgtsnd-photography-9.jpeg",
      "/images/case-studies/lodge-58-north/lodge-58-north-pgtsnd-photography-10.jpeg",
    ],
  },
  {
    slug: "nw-sablefish",
    client: "NW Sablefish",
    title: "NW Sablefish X PGTSND",
    subtitle: "Brand Identity & Visual Media",
    heroImage: "/images/case-studies/nw-sablefish/pgtsnd-fish-tail-nw-sablefish.jpg",
    testimonial: {
      quote: "PGTSND helped us build a brand identity from the ground up. From our logo to our website to our photography, everything works together seamlessly.",
      author: "Katie Harris, NW Sablefish",
      logo: "/images/about/katie-harris-headshot-pgtsnd-testimonial.jpg",
    },
    sectionTitle: "Inside Our Partnership",
    paragraphs: [
      "NW Sablefish needed a complete brand identity that could communicate the quality and sustainability of their product.",
      "We developed everything from logo design and brand guidelines to on-the-water photography and a fully custom website.",
      "The photography captures both the raw beauty of the fishing process and the refined presentation of the finished product.",
      "Every deliverable was designed to work as part of a cohesive system — giving NW Sablefish a brand that stands out in a competitive market.",
    ],
    gallery: [
      "/images/case-studies/nw-sablefish/nw-sablefish-pgtsnd-photography-7.jpeg",
      "/images/case-studies/nw-sablefish/nw-sablefish-pgtsnd-photography-2.JPG",
      "/images/case-studies/nw-sablefish/nw-sablefish-pgtsnd-photography-3.jpg",
      "/images/case-studies/nw-sablefish/nw-sablefish-pgtsnd-photography-4.jpg",
      "/images/case-studies/nw-sablefish/nw-sablefish-pgtsnd-photography-8.jpg",
      "/images/case-studies/nw-sablefish/nw-sablefish-pgtsnd-photography-9.JPG",
    ],
  },
  {
    slug: "alaska-whitefish-trawlers",
    client: "Alaska Whitefish Trawlers",
    title: "Alaska Whitefish Trawlers X PGTSND",
    subtitle: "Website & Photography",
    heroImage: "/images/case-studies/awt/aktrawlers-FINAL.png",
    testimonial: {
      quote: "PGTSND understood our industry and created a website and visual presence that accurately represents the professionalism and scale of our operations.",
      author: "Alaska Whitefish Trawlers",
    },
    sectionTitle: "Inside Our Partnership",
    paragraphs: [
      "Alaska Whitefish Trawlers needed a professional web presence and photography that could represent the scale and significance of their operations.",
      "We designed and built a custom website paired with industry photography that communicates both the heritage and the forward-thinking approach of the organization.",
      "The resulting digital presence serves as a hub for industry news, membership information, and public advocacy.",
      "Every element was crafted to reflect the professionalism and dedication of Alaska's whitefish trawling fleet.",
    ],
    gallery: [
      "/images/case-studies/awt/alaska-white-fish-web-design-sample-pgtsnd.webp",
      "/images/case-studies/awt/alaska-whitefish-web-design-sample-2.png",
    ],
  },
];

export function getCaseStudy(slug: string): CaseStudyData | undefined {
  return caseStudies.find((cs) => cs.slug === slug);
}

export function getAllCaseStudySlugs(): string[] {
  return caseStudies.map((cs) => cs.slug);
}

export default caseStudies;
