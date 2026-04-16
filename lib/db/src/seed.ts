import { db } from "./index";
import {
  usersTable,
  organizationsTable,
  projectsTable,
  projectMembersTable,
  tasksTable,
  taskItemsTable,
  deliverablesTable,
  reviewsTable,
  messagesTable,
  contractsTable,
  reviewRemindersTable,
  magicLinkTokensTable,
} from "./schema";

async function seed() {
  console.log("Seeding database...");

  await db.delete(reviewRemindersTable);
  await db.delete(reviewsTable);
  await db.delete(messagesTable);
  await db.delete(contractsTable);
  await db.delete(deliverablesTable);
  await db.delete(taskItemsTable);
  await db.delete(tasksTable);
  await db.delete(projectMembersTable);
  await db.delete(projectsTable);
  await db.delete(organizationsTable);
  await db.delete(magicLinkTokensTable);
  await db.delete(usersTable);

  const [bri, marcus, jamie, alex, sam, kandice] = await db
    .insert(usersTable)
    .values([
      {
        email: "bri@pgtsnd.com",
        name: "Bri Dwyer",
        role: "owner",
        title: "Owner / Director",
        initials: "BD",
      },
      {
        email: "marcus@pgtsnd.com",
        name: "Marcus Cole",
        role: "crew",
        title: "DP",
        initials: "MC",
      },
      {
        email: "jamie@pgtsnd.com",
        name: "Jamie Lin",
        role: "crew",
        title: "Editor",
        initials: "JL",
      },
      {
        email: "alex@pgtsnd.com",
        name: "Alex Torres",
        role: "crew",
        title: "Colorist",
        initials: "AT",
      },
      {
        email: "sam@pgtsnd.com",
        name: "Sam Reeves",
        role: "crew",
        title: "DP",
        initials: "SR",
      },
      {
        email: "kandice@pgtsnd.com",
        name: "Kandice M.",
        role: "partner",
        title: "PM",
        initials: "KM",
      },
    ])
    .returning();

  const [nicole, marcusTran, sarahChen, lenaPark] = await db
    .insert(usersTable)
    .values([
      {
        email: "nicole@netyourproblem.com",
        name: "Nicole Baker",
        role: "client",
        initials: "NB",
      },
      {
        email: "marcus@tranarch.com",
        name: "Marcus Tran",
        role: "client",
        initials: "MT",
      },
      {
        email: "sarah@pacificnwhealth.com",
        name: "Sarah Chen",
        role: "client",
        initials: "SC",
      },
      {
        email: "lena@cascadecoffee.com",
        name: "Lena Park",
        role: "client",
        initials: "LP",
      },
    ])
    .returning();

  const [netYourProblem, tranArch, pacificNW, cascadeCoffee] = await db
    .insert(organizationsTable)
    .values([
      {
        name: "Net Your Problem",
        contactName: "Nicole Baker",
        contactEmail: "nicole@netyourproblem.com",
      },
      {
        name: "Tran Architecture",
        contactName: "Marcus Tran",
        contactEmail: "marcus@tranarch.com",
      },
      {
        name: "Pacific NW Health",
        contactName: "Sarah Chen",
        contactEmail: "sarah@pacificnwhealth.com",
      },
      {
        name: "Cascade Coffee Co.",
        contactName: "Lena Park",
        contactEmail: "lena@cascadecoffee.com",
      },
    ])
    .returning();

  const [springCampaign, productLaunch, brandStory, annualReport, investorDeck, socialMedia] =
    await db
      .insert(projectsTable)
      .values([
        {
          name: "Spring Campaign Film",
          description: "Full campaign film for Net Your Problem spring launch",
          status: "in_progress",
          phase: "post_production",
          organizationId: netYourProblem.id,
          clientId: nicole.id,
          progress: 55,
          dueDate: new Date("2026-05-15"),
          budget: 15000,
        },
        {
          name: "Product Launch Teaser",
          description: "Teaser video for Net Your Problem product launch",
          status: "active",
          phase: "production",
          organizationId: netYourProblem.id,
          clientId: nicole.id,
          progress: 30,
          dueDate: new Date("2026-06-02"),
          budget: 8000,
        },
        {
          name: "Brand Story — Founders Cut",
          description: "Brand story documentary for Tran Architecture",
          status: "lead",
          phase: "pre_production",
          organizationId: tranArch.id,
          clientId: marcusTran.id,
          progress: 15,
        },
        {
          name: "Annual Report Video",
          description: "Annual report video for Pacific NW Health",
          status: "delivered",
          phase: "delivered",
          organizationId: pacificNW.id,
          clientId: sarahChen.id,
          progress: 100,
          dueDate: new Date("2026-01-20"),
          budget: 12000,
        },
        {
          name: "Investor Deck Video",
          description: "Investor deck video for Pacific NW Health",
          status: "delivered",
          phase: "delivered",
          organizationId: pacificNW.id,
          clientId: sarahChen.id,
          progress: 100,
          dueDate: new Date("2026-02-01"),
          budget: 6000,
        },
        {
          name: "Social Media Package",
          description: "Social media content package for Cascade Coffee",
          status: "archived",
          phase: "delivered",
          organizationId: cascadeCoffee.id,
          clientId: lenaPark.id,
          progress: 100,
          dueDate: new Date("2024-09-15"),
          budget: 4000,
        },
      ])
      .returning();

  await db.insert(projectMembersTable).values([
    { projectId: springCampaign.id, userId: bri.id, role: "Director" },
    { projectId: springCampaign.id, userId: marcus.id, role: "DP" },
    { projectId: springCampaign.id, userId: jamie.id, role: "Editor" },
    { projectId: springCampaign.id, userId: alex.id, role: "Colorist" },
    { projectId: springCampaign.id, userId: kandice.id, role: "PM" },
    { projectId: productLaunch.id, userId: bri.id, role: "Director" },
    { projectId: productLaunch.id, userId: sam.id, role: "DP" },
    { projectId: productLaunch.id, userId: jamie.id, role: "Editor" },
    { projectId: brandStory.id, userId: bri.id, role: "Director" },
    { projectId: brandStory.id, userId: marcus.id, role: "DP" },
    { projectId: annualReport.id, userId: bri.id, role: "Director" },
    { projectId: annualReport.id, userId: jamie.id, role: "Editor" },
    { projectId: annualReport.id, userId: alex.id, role: "Colorist" },
    { projectId: investorDeck.id, userId: bri.id, role: "Director" },
    { projectId: investorDeck.id, userId: sam.id, role: "DP" },
    { projectId: socialMedia.id, userId: bri.id, role: "Director" },
    { projectId: socialMedia.id, userId: marcus.id, role: "DP" },
  ]);

  const springTasks = await db
    .insert(tasksTable)
    .values([
      {
        projectId: springCampaign.id,
        title: "Script finalization",
        status: "done",
        assigneeId: bri.id,
        progress: 100,
        sortOrder: 1,
      },
      {
        projectId: springCampaign.id,
        title: "Location scouting",
        status: "done",
        assigneeId: marcus.id,
        progress: 100,
        sortOrder: 2,
      },
      {
        projectId: springCampaign.id,
        title: "Principal photography",
        status: "done",
        assigneeId: marcus.id,
        progress: 100,
        sortOrder: 3,
      },
      {
        projectId: springCampaign.id,
        title: "Rough cut edit",
        status: "in_progress",
        assigneeId: jamie.id,
        progress: 80,
        sortOrder: 4,
      },
      {
        projectId: springCampaign.id,
        title: "Color grading",
        status: "in_progress",
        assigneeId: alex.id,
        progress: 30,
        sortOrder: 5,
      },
      {
        projectId: springCampaign.id,
        title: "Sound design & mix",
        status: "todo",
        assigneeId: jamie.id,
        progress: 0,
        sortOrder: 6,
      },
      {
        projectId: springCampaign.id,
        title: "Client review — rough cut",
        status: "todo",
        progress: 0,
        sortOrder: 7,
      },
      {
        projectId: springCampaign.id,
        title: "Final delivery",
        status: "todo",
        progress: 0,
        sortOrder: 8,
      },
    ])
    .returning();

  await db.insert(tasksTable).values([
    {
      projectId: productLaunch.id,
      title: "Concept development",
      status: "done",
      assigneeId: bri.id,
      progress: 100,
      sortOrder: 1,
    },
    {
      projectId: productLaunch.id,
      title: "Storyboarding",
      status: "done",
      assigneeId: bri.id,
      progress: 100,
      sortOrder: 2,
    },
    {
      projectId: productLaunch.id,
      title: "Product filming",
      status: "in_progress",
      assigneeId: sam.id,
      progress: 50,
      sortOrder: 3,
    },
    {
      projectId: productLaunch.id,
      title: "Edit & assembly",
      status: "todo",
      assigneeId: jamie.id,
      progress: 0,
      sortOrder: 4,
    },
    {
      projectId: productLaunch.id,
      title: "Motion graphics",
      status: "todo",
      progress: 0,
      sortOrder: 5,
    },
  ]);

  const roughCutDeliverable = await db
    .insert(deliverablesTable)
    .values([
      {
        projectId: springCampaign.id,
        taskId: springTasks[3].id,
        title: "Spring Campaign Film — v3",
        description: "Rough cut v3 for client review",
        type: "video",
        status: "in_review",
        version: "v3",
        submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        projectId: springCampaign.id,
        title: "Social Media Graphics — Batch 2",
        description: "Second batch of social media graphics",
        type: "graphics",
        status: "in_review",
        version: "v1",
        submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        projectId: productLaunch.id,
        title: "Blog Post — Behind the Scenes",
        description: "Behind the scenes blog post content",
        type: "document",
        status: "in_review",
        version: "v1",
        submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    ])
    .returning();

  await db.insert(contractsTable).values([
    {
      projectId: springCampaign.id,
      title: "Spring Campaign SOW",
      type: "SOW",
      status: "signed",
      amount: 15000,
      signedAt: new Date("2026-03-01"),
    },
    {
      projectId: springCampaign.id,
      title: "Amendment — Extended Deliverables",
      type: "Amendment",
      status: "sent",
      amount: 3000,
      sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      projectId: productLaunch.id,
      title: "Product Launch SOW",
      type: "SOW",
      status: "sent",
      amount: 8000,
      sentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  ]);

  await db.insert(messagesTable).values([
    {
      projectId: springCampaign.id,
      senderId: bri.id,
      content: "Let me know when you've reviewed the latest cut",
      read: false,
    },
    {
      projectId: productLaunch.id,
      senderId: sam.id,
      content: "Macro lens reveal idea for the product launch",
      read: true,
    },
    {
      projectId: springCampaign.id,
      senderId: kandice.id,
      content: "Rough cut targeting Friday — I'll send the review link",
      read: true,
    },
  ]);

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
