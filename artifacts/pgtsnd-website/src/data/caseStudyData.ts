const SQ = "https://images.squarespace-cdn.com/content/v1/6437205938fdc67907c14df5";

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
    heroImage: `${SQ}/ff6516bf-ae6b-4c2a-833f-c570b60daced/pgtsnd-vallation-outerwear-photography-19.jpeg`,
    testimonial: {
      quote: "When we decided we needed more photos of our gear in its element in commercial fishing we reached out to Bri at PGTSND Productions. Their prior work and experience within commercial fishing made our choice easy.",
      author: "Cory Jackson, Vallation Outerwear",
      logo: `${SQ}/f16cb15a-0aaa-4577-9fa4-8cf9e110b702/vallation-outerwear-logo.png`,
    },
    sectionTitle: "Inside Our Partnership",
    paragraphs: [
      "Capturing the brand at work in its natural element was the goal.",
      "By taking to the open water for a lifestyle-focused photoshoot, we showcased their gear in the conditions it was built for.",
      "The resulting gallery gave Vallation a versatile library of professional images, ready to be used across their website, print materials, point-of-sale displays, and social media content.",
      "The strength of these visuals creates consistency, elevates brand presence, and extends the life of every marketing effort. With this shoot, Vallation gained photography that works as hard as their outerwear does.",
    ],
    gallery: [
      `${SQ}/b840b2b5-7470-4634-bb25-96469b999ed2/pgtsnd-vallation-outerwear-photography-18.jpeg`,
      `${SQ}/93152329-7283-4019-9e2e-17cc7909baba/pgtsnd-vallation-outerwear-photography-3.jpeg`,
      `${SQ}/594a3936-ed9f-472e-9bc4-1b1667be75f0/pgtsnd-vallation-outerwear-photography-12.jpeg`,
      `${SQ}/f0e3f237-53e0-4ce0-ba01-af2b71826b07/pgtsnd-vallation-outerwear-photography-4.jpeg`,
      `${SQ}/3d467e5c-a214-428a-acb9-cb1329ec0db8/pgtsnd-vallation-outerwear-photography-6.jpeg`,
      `${SQ}/157b97a6-c283-464c-ba8b-f2748f355b71/pgtsnd-vallation-outerwear-photography-7.jpeg`,
      `${SQ}/b772f9a8-4f3a-409e-9b9c-d027793ecb9f/pgtsnd-vallation-outerwear-photography-9.jpeg`,
      `${SQ}/b861c655-d267-4a2d-be8f-8e749817915c/pgtsnd-vallation-outerwear-photography-10.jpeg`,
      `${SQ}/5c05e558-67c5-438d-a12e-e53627e7676d/pgtsnd-vallation-outerwear-photography-2.jpeg`,
    ],
  },
  {
    slug: "alaska-bering-sea-crabbers",
    client: "Alaska Bering Sea Crabbers",
    title: "Alaska Bering Sea Crabbers X PGTSND",
    subtitle: "A Visual Campaign",
    heroImage: `${SQ}/c5281c8f-b90b-47e2-91dd-19022c0c5d1d/ABSC-200.jpg`,
    testimonial: {
      quote: "PGTSND has been instrumental in telling the story of our fishermen and the sustainable practices that define Alaska's crab fisheries. Their work captures the grit and dedication of our industry.",
      author: "Jamie Goen, Alaska Bering Sea Crabbers",
      logo: `${SQ}/2de5fc52-919a-43e2-98e1-c4490cca1679/Jamie-Goen-Alaska-Bering-Sea-Crabbers-pgt-snd.jpg`,
    },
    sectionTitle: "Inside Our Partnership",
    paragraphs: [
      "Alaska Bering Sea Crabbers needed a comprehensive visual campaign to support their advocacy and public awareness efforts.",
      "We traveled to Dutch Harbor to document the real people and real work behind one of the world's most demanding fisheries.",
      "The resulting content spanned photography, social media assets, web design, and branded materials — giving ABSC a cohesive visual identity that communicates the value and sustainability of their industry.",
      "From social graphics to on-the-water photography, every deliverable was designed to build public trust and industry pride.",
    ],
    gallery: [
      `${SQ}/666bb24c-f59a-4d77-b298-239c8988dfec/pgtsnd-ABSC-photography-1.jpeg`,
      `${SQ}/b9c6c138-9126-4b01-bb8f-d39e0aace022/pgtsnd-ABSC-photography-2.jpeg`,
      `${SQ}/724e6ae3-7d62-4005-af54-03ea67b036ab/pgtsnd-ABSC-photography-3.jpg`,
      `${SQ}/9fe60271-f30f-4c62-9c88-10ffada85e29/pgtsnd-ABSC-photography-4.jpeg`,
      `${SQ}/0eab44ed-59d7-415a-9980-b6471600ece4/pgtsnd-ABSC-photography-5.jpeg`,
      `${SQ}/24a14adf-4ce4-405d-bacd-3b665e65f15b/pgtsnd-ABSC-photography-6.jpeg`,
      `${SQ}/a9d2a33a-a7ff-4efb-b7bc-ff22878011b6/pgtsnd-ABSC-photography-7.jpeg`,
      `${SQ}/63f4fb69-e0a8-46a4-8e30-116d54e726a5/pgtsnd-ABSC-photography-8.jpeg`,
    ],
  },
  {
    slug: "green-juju",
    client: "Green Juju",
    title: "Green Juju X PGTSND",
    subtitle: "Full Production Suite +",
    heroImage: `${SQ}/d9460e68-5cd2-4c0f-94e1-1882061a71e3/green-juju-dog-kitchen-pgtsnd.jpeg`,
    testimonial: {
      quote: "Bri and her team have completely transformed our digital presence, and the difference has been remarkable. Their understanding of our brand and audience has made all the difference.",
      author: "Kelly Marian, Green Juju",
      logo: `${SQ}/7bc26c26-455f-40a9-a671-e74403d35309/kelly-green-juju.webp`,
    },
    sectionTitle: "Inside Our Partnership",
    paragraphs: [
      "Green Juju came to PGTSND looking for a complete overhaul of their visual identity and digital presence.",
      "We developed a full suite of photography, video, social media content, and web design that reflects their mission of providing whole-food nutrition for pets.",
      "From product photography and lifestyle shoots to animated social graphics and a fully redesigned website, every asset was built to work together.",
      "The result is a cohesive brand presence that connects with pet owners and communicates Green Juju's commitment to quality ingredients.",
    ],
    gallery: [
      `${SQ}/b4e9b111-3e74-4b5b-83dd-98f1d02798b3/green-juju-ingredients-pgt-snd-bri-dwyer.jpeg`,
      `${SQ}/757c20ef-3b28-4482-890e-e3e36d5d4ae2/founder-farm-green-juju-pgtsnd-bri-dwyer.jpg`,
      `${SQ}/8ed428da-be7c-4f6d-95f9-b97b8b7a5319/pets-green-juju-pgtsnd-bri-dwyer.jpeg`,
      `${SQ}/9d281eb5-fa46-4f12-8304-67eacb64298b/puppies-green-juju-pgtsnd.jpeg`,
      `${SQ}/55a02970-3204-4c14-8e2d-5edb693fcf5a/green-juju-supplements-close-pgtsnd.jpeg`,
      `${SQ}/ef39cdb3-fa41-40b6-b61e-557e31005634/green-juju-ingredientspgtsnd-photography.jpeg`,
      `${SQ}/e2b61cb6-31db-4a52-973a-add624db00c5/green-juju-vitality-blend-pgtsnd.jpeg`,
    ],
  },
  {
    slug: "net-your-problem",
    client: "Net Your Problem",
    title: "Net Your Problem X PGTSND",
    subtitle: "Brand Film Production",
    heroImage: `${SQ}/08b66ad6-17cc-43cb-8a86-a19c5f3551e4/net-your-problem-pgt-snd-photography-1.jpeg`,
    testimonial: {
      quote: "The films we have created with PGTSND have been remarkably useful for us at conferences and in helping to recruit new partners. Their ability to capture our technology in action has been invaluable.",
      author: "Nicole Baker, Net Your Problem",
      logo: `${SQ}/3ac5c6c9-cb24-463f-b0e5-f7e38da1179b/nicole-baker-pgtsnd.jpg`,
    },
    sectionTitle: "Inside Our Partnership",
    paragraphs: [
      "Net Your Problem needed compelling video assets to present at industry conferences and help recruit new partners.",
      "We spent time on the water with their team, capturing the real work behind their fishing technology innovation.",
      "The resulting brand films showcase both the problem their product solves and the people behind the solution.",
      "These films have become a cornerstone of Net Your Problem's conference presentations and partner recruitment efforts.",
    ],
    gallery: [
      `${SQ}/f1410478-0f76-4db0-9aba-7ceb4363c9a8/net-your-progblem-pgtsnd-photography-2.jpeg`,
      `${SQ}/acec269d-a5b2-4b82-9332-b6e982cd9cae/net-your-problem-pgt-snd-photography-4.jpeg`,
      `${SQ}/be5237a8-936d-4538-915d-b8db05077921/net-your-problem-pgt-snd-photography-5.jpeg`,
      `${SQ}/5cf309ca-c19a-4859-a7f1-bfc4abcf45bb/net-your-problem-pgtsnd-photography-6.jpeg`,
      `${SQ}/41d1c9b8-7c7a-43d3-b21d-e53aaf6c0e57/net-your-problem-pgtsnd-photography-7.jpeg`,
      `${SQ}/17f226d3-a08b-46c2-8ef3-bfa25b1a99c4/net-your-problem-pgtsnd-photography-8.jpeg`,
      `${SQ}/b5496abf-5414-40c0-9185-8d45b3f07a40/net-your-problem-pgtsnd-photgraphy-9.jpeg`,
    ],
  },
  {
    slug: "lodge-58-north",
    client: "Lodge @ 58 North",
    title: "Lodge @ 58 North X PGTSND",
    subtitle: "Video Production | Photography",
    heroImage: `${SQ}/3a3c9078-fa7d-475e-aef7-f4ab48b19728/lodge-58-north-pgtsnd-photography-1.jpeg`,
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
      `${SQ}/2147988f-12fa-485c-bec4-86f9cd386716/lodge-58-north-pgtsnd-photography-2.jpeg`,
      `${SQ}/4f079e9e-8cf9-4713-92ff-f455d9347e1e/lodge-58-north-pgtsnd-photography-3.jpeg`,
      `${SQ}/3d5fdfab-b978-4048-8fb0-9f2a31dfa710/lodge-58-north-pgtsnd-photography-4.jpeg`,
      `${SQ}/660a1adc-c597-43c0-a724-7489d83d92ae/lodge-58-north-pgtsnd-photography-5.jpeg`,
      `${SQ}/cdddc0a3-c806-47b1-9ab5-1f1caaf43ac3/lodge-58-north-pgtsnd-photography-6.jpeg`,
      `${SQ}/2d377987-3d8e-4f26-8f3a-679bc8f7faac/lodge-58-north-pgtsnd-photography-7.jpeg`,
      `${SQ}/3c4d192c-904c-492b-b231-b956a4b8a3f9/lodge-58-north-pgtsnd-photography-8.jpeg`,
      `${SQ}/6905dff7-a7ab-4f20-bcf6-6dad7fbc93aa/lodge-58-north-pgtsnd-photography-9.jpeg`,
      `${SQ}/648d4721-fd76-43e0-b731-bfb434e494e4/lodge-58-north-pgtsnd-photography-10.jpeg`,
    ],
  },
  {
    slug: "nw-sablefish",
    client: "NW Sablefish",
    title: "NW Sablefish X PGTSND",
    subtitle: "Brand Identity & Visual Media",
    heroImage: `${SQ}/84f78130-4f80-4f34-bef0-2a50f376afd7/pgtsnd-fish-tail-nw-sablefish.jpg`,
    testimonial: {
      quote: "PGTSND helped us build a brand identity from the ground up. From our logo to our website to our photography, everything works together seamlessly.",
      author: "Katie Harris, NW Sablefish",
      logo: `${SQ}/4d53ebb7-4229-4ee2-bdc4-72340741072f/katie-harris-headshot-pgtsnd-testimonial.jpg`,
    },
    sectionTitle: "Inside Our Partnership",
    paragraphs: [
      "NW Sablefish needed a complete brand identity that could communicate the quality and sustainability of their product.",
      "We developed everything from logo design and brand guidelines to on-the-water photography and a fully custom website.",
      "The photography captures both the raw beauty of the fishing process and the refined presentation of the finished product.",
      "Every deliverable was designed to work as part of a cohesive system — giving NW Sablefish a brand that stands out in a competitive market.",
    ],
    gallery: [
      `${SQ}/93006ba2-8cb2-4602-994e-d06460bddefb/nw-sablefish-pgtsnd-photography-7.jpeg`,
      `${SQ}/2b467b4e-c589-4307-9467-83d43335b25e/nw-sablefish-pgtsnd-photography-2.JPG`,
      `${SQ}/c647e711-0513-486e-9838-da5fab65a4bf/nw-sablefish-pgtsnd-photography-3.jpg`,
      `${SQ}/30ed6117-3506-43a2-95c2-ea5e9488664f/nw-sablefish-pgtsnd-photography-4.jpg`,
      `${SQ}/46196bcd-86d8-4ae1-a37a-2c48c3d37a14/nw-sablefish-pgtsnd-photography-8.jpg`,
      `${SQ}/9418b4da-9a64-4271-b863-1fcb42572e1c/nw-sablefish-pgtsnd-photography-9.JPG`,
    ],
  },
  {
    slug: "alaska-whitefish-trawlers",
    client: "Alaska Whitefish Trawlers",
    title: "Alaska Whitefish Trawlers X PGTSND",
    subtitle: "Website & Photography",
    heroImage: `${SQ}/c09ac88a-9660-4632-bd8d-30ba6660ab13/aktrawlers-FINAL.png`,
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
      `${SQ}/2bbe095a-dc39-4e46-961e-4bc9ec528a53/alaska-white-fish-web-design-sample-pgtsnd.webp`,
      `${SQ}/b3bfa3ba-0ef5-4631-8669-97b40a66f648/alaska-whitefish-web-design-sample-2.png`,
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
