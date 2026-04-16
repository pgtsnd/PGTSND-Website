import { db } from "./index";
import {
  usersTable,
  organizationsTable,
  projectsTable,
  projectMembersTable,
  phasesTable,
  tasksTable,
  taskItemsTable,
  deliverablesTable,
  reviewsTable,
  messagesTable,
  contractsTable,
  reviewRemindersTable,
  invoicesTable,
  integrationSettingsTable,
  magicLinkTokensTable,
  videoCommentsTable,
  videoCommentRepliesTable,
  reviewLinksTable,
} from "./schema";

async function seed() {
  console.log("Seeding database...");

  await db.delete(videoCommentRepliesTable);
  await db.delete(videoCommentsTable);
  await db.delete(reviewLinksTable);
  await db.delete(reviewRemindersTable);
  await db.delete(reviewsTable);
  await db.delete(messagesTable);
  await db.delete(invoicesTable);
  await db.delete(contractsTable);
  await db.delete(deliverablesTable);
  await db.delete(taskItemsTable);
  await db.delete(tasksTable);
  await db.delete(phasesTable);
  await db.delete(projectMembersTable);
  await db.delete(projectsTable);
  await db.delete(organizationsTable);
  await db.delete(integrationSettingsTable);
  await db.delete(magicLinkTokensTable);
  await db.delete(usersTable);

  // ── TEAM USERS ──
  const [testOwner, bri, marcus, jamie, alex, sam, kandice, testCrew] = await db
    .insert(usersTable)
    .values([
      {
        email: "test@pgtsnd.com",
        name: "Test Owner",
        role: "owner",
        title: "Owner / Producer",
        initials: "TO",
      },
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
        title: "Director of Photography",
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
        title: "Colorist / VFX",
        initials: "AT",
      },
      {
        email: "sam@pgtsnd.com",
        name: "Sam Reeves",
        role: "crew",
        title: "Second Camera / Drone Op",
        initials: "SR",
      },
      {
        email: "kandice@pgtsnd.com",
        name: "Kandice M.",
        role: "partner",
        title: "Project Manager",
        initials: "KM",
      },
      {
        email: "testcrew@pgtsnd.com",
        name: "Test Crew",
        role: "crew",
        title: "Production Assistant",
        initials: "TC",
      },
    ])
    .returning();

  // ── CLIENTS ──
  const [nicole, marcusTran, sarahChen, lenaPark, ryanHolt, testClient] = await db
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
      {
        email: "ryan@vallationouterwear.com",
        name: "Ryan Holt",
        role: "client",
        initials: "RH",
      },
      {
        email: "testclient@pgtsnd.com",
        name: "Test Client",
        role: "client",
        initials: "CL",
      },
    ])
    .returning();

  // ── ORGANIZATIONS ──
  const [netYourProblem, tranArch, pacificNW, cascadeCoffee, vallation] = await db
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
      {
        name: "Vallation Outerwear",
        contactName: "Ryan Holt",
        contactEmail: "ryan@vallationouterwear.com",
      },
    ])
    .returning();

  // ── 5 PROJECTS ──
  const [proj1, proj2, proj3, proj4, proj5] = await db
    .insert(projectsTable)
    .values([
      {
        name: "Net Your Problem — Spring Campaign Film",
        description:
          "Full-length brand campaign film for the spring product launch. Includes hero film (2:30), three 15s social cutdowns, and BTS content package. Shooting on location in Kodiak, AK.",
        status: "in_progress",
        phase: "post_production",
        organizationId: netYourProblem.id,
        clientId: testClient.id,
        progress: 62,
        dueDate: new Date("2026-05-15"),
        startDate: new Date("2026-02-01"),
        budget: 28000,
      },
      {
        name: "Tran Architecture — Founders Story",
        description:
          "Documentary-style brand film following Marcus Tran through a day at the studio and two project sites. Goal: position Tran Arch as a thought leader in sustainable Pacific NW design. Deliverables include a 5-min hero film and a 90s sizzle reel.",
        status: "in_progress",
        phase: "production",
        organizationId: tranArch.id,
        clientId: marcusTran.id,
        progress: 35,
        dueDate: new Date("2026-06-30"),
        startDate: new Date("2026-03-15"),
        budget: 22000,
      },
      {
        name: "Pacific NW Health — Annual Report Video",
        description:
          "Annual impact report video for Pacific NW Health's board presentation and donor outreach. Mixed-media approach: interview footage, motion graphics for data visualization, and archival b-roll. 3-minute final cut.",
        status: "review",
        phase: "review",
        organizationId: pacificNW.id,
        clientId: testClient.id,
        progress: 88,
        dueDate: new Date("2026-04-25"),
        startDate: new Date("2026-01-10"),
        budget: 15000,
      },
      {
        name: "Cascade Coffee — Roastery Series",
        description:
          "4-part social video series documenting the bean-to-cup journey at Cascade Coffee's new Portland roastery. Each episode is 60-90s, optimized for Instagram Reels and TikTok. Includes photography package (40 edited stills).",
        status: "active",
        phase: "pre_production",
        organizationId: cascadeCoffee.id,
        clientId: lenaPark.id,
        progress: 12,
        dueDate: new Date("2026-07-20"),
        startDate: new Date("2026-04-01"),
        budget: 18000,
      },
      {
        name: "Vallation Outerwear — Product Launch",
        description:
          "Product launch content for Vallation's new alpine collection. Hero film (1:30), product detail videos x4, and lookbook photography (60 stills). Shooting in the North Cascades over 3 days.",
        status: "delivered",
        phase: "delivered",
        organizationId: vallation.id,
        clientId: ryanHolt.id,
        progress: 100,
        dueDate: new Date("2026-03-01"),
        startDate: new Date("2025-11-15"),
        budget: 32000,
      },
    ])
    .returning();

  // ── PROJECT MEMBERS ──
  await db.insert(projectMembersTable).values([
    { projectId: proj1.id, userId: testOwner.id, role: "Producer" },
    { projectId: proj1.id, userId: bri.id, role: "Director" },
    { projectId: proj1.id, userId: marcus.id, role: "DP" },
    { projectId: proj1.id, userId: jamie.id, role: "Editor" },
    { projectId: proj1.id, userId: alex.id, role: "Colorist" },
    { projectId: proj1.id, userId: kandice.id, role: "PM" },

    { projectId: proj2.id, userId: testOwner.id, role: "Producer" },
    { projectId: proj2.id, userId: bri.id, role: "Director" },
    { projectId: proj2.id, userId: marcus.id, role: "DP" },
    { projectId: proj2.id, userId: sam.id, role: "Second Camera" },
    { projectId: proj2.id, userId: kandice.id, role: "PM" },

    { projectId: proj3.id, userId: testOwner.id, role: "Producer" },
    { projectId: proj3.id, userId: bri.id, role: "Director" },
    { projectId: proj3.id, userId: jamie.id, role: "Editor" },
    { projectId: proj3.id, userId: alex.id, role: "Motion Graphics" },

    { projectId: proj4.id, userId: testOwner.id, role: "Producer" },
    { projectId: proj4.id, userId: bri.id, role: "Director" },
    { projectId: proj4.id, userId: sam.id, role: "DP" },
    { projectId: proj4.id, userId: marcus.id, role: "Photographer" },
    { projectId: proj4.id, userId: kandice.id, role: "PM" },

    { projectId: proj5.id, userId: testOwner.id, role: "Producer" },
    { projectId: proj5.id, userId: bri.id, role: "Director" },
    { projectId: proj5.id, userId: marcus.id, role: "DP" },
    { projectId: proj5.id, userId: sam.id, role: "Drone Op" },
    { projectId: proj5.id, userId: jamie.id, role: "Editor" },
    { projectId: proj5.id, userId: alex.id, role: "Colorist" },
    { projectId: proj5.id, userId: kandice.id, role: "PM" },

    { projectId: proj1.id, userId: testCrew.id, role: "PA" },
    { projectId: proj2.id, userId: testCrew.id, role: "PA" },
    { projectId: proj4.id, userId: testCrew.id, role: "PA" },
  ]);

  // ── PHASES ──
  const [p1Pre, p1Prod, p1Post, p1Delivery] = await db
    .insert(phasesTable)
    .values([
      { projectId: proj1.id, name: "Pre-Production", sortOrder: 0 },
      { projectId: proj1.id, name: "Production", sortOrder: 1 },
      { projectId: proj1.id, name: "Post-Production", sortOrder: 2 },
      { projectId: proj1.id, name: "Delivery", sortOrder: 3 },
    ])
    .returning();

  const [p2Pre, p2Prod, p2Post, p2Delivery] = await db
    .insert(phasesTable)
    .values([
      { projectId: proj2.id, name: "Pre-Production", sortOrder: 0 },
      { projectId: proj2.id, name: "Production", sortOrder: 1 },
      { projectId: proj2.id, name: "Post-Production", sortOrder: 2 },
      { projectId: proj2.id, name: "Delivery", sortOrder: 3 },
    ])
    .returning();

  const [p3Pre, p3Prod, p3Post, p3Delivery] = await db
    .insert(phasesTable)
    .values([
      { projectId: proj3.id, name: "Pre-Production", sortOrder: 0 },
      { projectId: proj3.id, name: "Production", sortOrder: 1 },
      { projectId: proj3.id, name: "Post-Production", sortOrder: 2 },
      { projectId: proj3.id, name: "Delivery", sortOrder: 3 },
    ])
    .returning();

  const [p4Pre, p4Prod, p4Post, p4Delivery] = await db
    .insert(phasesTable)
    .values([
      { projectId: proj4.id, name: "Pre-Production", sortOrder: 0 },
      { projectId: proj4.id, name: "Production", sortOrder: 1 },
      { projectId: proj4.id, name: "Post-Production", sortOrder: 2 },
      { projectId: proj4.id, name: "Delivery", sortOrder: 3 },
    ])
    .returning();

  const [p5Pre, p5Prod, p5Post, p5Delivery] = await db
    .insert(phasesTable)
    .values([
      { projectId: proj5.id, name: "Pre-Production", sortOrder: 0 },
      { projectId: proj5.id, name: "Production", sortOrder: 1 },
      { projectId: proj5.id, name: "Post-Production", sortOrder: 2 },
      { projectId: proj5.id, name: "Delivery", sortOrder: 3 },
    ])
    .returning();

  // ── PROJECT 1 TASKS: Net Your Problem — Spring Campaign ──
  const p1Tasks = await db
    .insert(tasksTable)
    .values([
      { projectId: proj1.id, phaseId: p1Pre.id, title: "Creative brief & moodboard", status: "done", assigneeId: bri.id, progress: 100, sortOrder: 1 },
      { projectId: proj1.id, phaseId: p1Pre.id, title: "Script & storyboard", status: "done", assigneeId: bri.id, progress: 100, sortOrder: 2 },
      { projectId: proj1.id, phaseId: p1Pre.id, title: "Location scouting — Kodiak", status: "done", assigneeId: marcus.id, progress: 100, sortOrder: 3 },
      { projectId: proj1.id, phaseId: p1Pre.id, title: "Talent casting & scheduling", status: "done", assigneeId: kandice.id, progress: 100, sortOrder: 4 },
      { projectId: proj1.id, phaseId: p1Prod.id, title: "Principal photography — Day 1 (Harbor)", status: "done", assigneeId: marcus.id, progress: 100, sortOrder: 5 },
      { projectId: proj1.id, phaseId: p1Prod.id, title: "Principal photography — Day 2 (Processing)", status: "done", assigneeId: marcus.id, progress: 100, sortOrder: 6 },
      { projectId: proj1.id, phaseId: p1Prod.id, title: "Principal photography — Day 3 (Community)", status: "done", assigneeId: marcus.id, progress: 100, sortOrder: 7 },
      { projectId: proj1.id, phaseId: p1Post.id, title: "Rough cut assembly", status: "done", assigneeId: jamie.id, progress: 100, sortOrder: 8 },
      { projectId: proj1.id, phaseId: p1Post.id, title: "Rough cut v2 — client feedback pass", status: "done", assigneeId: jamie.id, progress: 100, sortOrder: 9 },
      { projectId: proj1.id, phaseId: p1Post.id, title: "Fine cut — hero film", status: "in_progress", assigneeId: jamie.id, progress: 70, sortOrder: 10 },
      { projectId: proj1.id, phaseId: p1Post.id, title: "Color grade — hero film", status: "in_progress", assigneeId: alex.id, progress: 40, sortOrder: 11 },
      { projectId: proj1.id, phaseId: p1Post.id, title: "Sound design & music licensing", status: "in_progress", assigneeId: jamie.id, progress: 25, sortOrder: 12 },
      { projectId: proj1.id, phaseId: p1Post.id, title: "Social cutdowns (3x 15s)", status: "todo", assigneeId: jamie.id, progress: 0, sortOrder: 13 },
      { projectId: proj1.id, phaseId: p1Post.id, title: "BTS content package", status: "todo", assigneeId: sam.id, progress: 0, sortOrder: 14 },
      { projectId: proj1.id, phaseId: p1Delivery.id, title: "Client review — fine cut", status: "todo", progress: 0, sortOrder: 15 },
      { projectId: proj1.id, phaseId: p1Delivery.id, title: "Final master & delivery", status: "todo", progress: 0, sortOrder: 16 },
    ])
    .returning();

  await db.insert(taskItemsTable).values([
    { taskId: p1Tasks[9].id, title: "Tighten interview selects", completed: true, sortOrder: 1 },
    { taskId: p1Tasks[9].id, title: "Refine b-roll pacing in harbor sequence", completed: true, sortOrder: 2 },
    { taskId: p1Tasks[9].id, title: "Add motion graphics lower thirds", completed: false, sortOrder: 3 },
    { taskId: p1Tasks[9].id, title: "Integrate licensed music track", completed: false, sortOrder: 4 },
    { taskId: p1Tasks[10].id, title: "Primary grade — exposure & white balance", completed: true, sortOrder: 1 },
    { taskId: p1Tasks[10].id, title: "Secondary grade — skin tones", completed: false, sortOrder: 2 },
    { taskId: p1Tasks[10].id, title: "Look development — PGTSND signature grade", completed: false, sortOrder: 3 },
    { taskId: p1Tasks[10].id, title: "VFX cleanup — remove safety wire in shot 47", completed: false, sortOrder: 4 },
    { taskId: p1Tasks[11].id, title: "Source ambient sfx for harbor scenes", completed: true, sortOrder: 1 },
    { taskId: p1Tasks[11].id, title: "License hero music track", completed: false, sortOrder: 2 },
    { taskId: p1Tasks[11].id, title: "Foley pass for processing facility", completed: false, sortOrder: 3 },
    { taskId: p1Tasks[11].id, title: "Final mix — stereo and 5.1", completed: false, sortOrder: 4 },
  ]);

  // ── PROJECT 2 TASKS: Tran Architecture — Founders Story ──
  const p2Tasks = await db
    .insert(tasksTable)
    .values([
      { projectId: proj2.id, phaseId: p2Pre.id, title: "Discovery call & brief", status: "done", assigneeId: bri.id, progress: 100, sortOrder: 1 },
      { projectId: proj2.id, phaseId: p2Pre.id, title: "Research & pre-interviews", status: "done", assigneeId: bri.id, progress: 100, sortOrder: 2 },
      { projectId: proj2.id, phaseId: p2Pre.id, title: "Location scout — Studio + 2 project sites", status: "done", assigneeId: marcus.id, progress: 100, sortOrder: 3 },
      { projectId: proj2.id, phaseId: p2Prod.id, title: "Shoot day 1 — Studio interview & workspace", status: "done", assigneeId: marcus.id, progress: 100, sortOrder: 4 },
      { projectId: proj2.id, phaseId: p2Prod.id, title: "Shoot day 2 — Waterfront residence site", status: "in_progress", assigneeId: marcus.id, progress: 60, sortOrder: 5, dueDate: new Date("2026-04-22") },
      { projectId: proj2.id, phaseId: p2Prod.id, title: "Shoot day 3 — Community center project", status: "todo", assigneeId: sam.id, progress: 0, sortOrder: 6, dueDate: new Date("2026-04-28") },
      { projectId: proj2.id, phaseId: p2Prod.id, title: "Drone footage — all locations", status: "in_progress", assigneeId: sam.id, progress: 30, sortOrder: 7 },
      { projectId: proj2.id, phaseId: p2Post.id, title: "Transcription & selects", status: "todo", assigneeId: jamie.id, progress: 0, sortOrder: 8 },
      { projectId: proj2.id, phaseId: p2Post.id, title: "Rough cut — hero film", status: "todo", assigneeId: jamie.id, progress: 0, sortOrder: 9 },
      { projectId: proj2.id, phaseId: p2Post.id, title: "Sizzle reel cut (90s)", status: "todo", assigneeId: jamie.id, progress: 0, sortOrder: 10 },
      { projectId: proj2.id, phaseId: p2Post.id, title: "Client review round 1", status: "todo", progress: 0, sortOrder: 11 },
      { projectId: proj2.id, phaseId: p2Post.id, title: "Color & sound finish", status: "todo", assigneeId: alex.id, progress: 0, sortOrder: 12 },
      { projectId: proj2.id, phaseId: p2Delivery.id, title: "Final delivery", status: "todo", progress: 0, sortOrder: 13 },
    ])
    .returning();

  await db.insert(taskItemsTable).values([
    { taskId: p2Tasks[4].id, title: "Exterior walkthrough shots", completed: true, sortOrder: 1 },
    { taskId: p2Tasks[4].id, title: "Marcus interview on design philosophy", completed: true, sortOrder: 2 },
    { taskId: p2Tasks[4].id, title: "Interior detail shots — materials & textures", completed: false, sortOrder: 3 },
    { taskId: p2Tasks[4].id, title: "Time-lapse of site from hillside", completed: false, sortOrder: 4 },
    { taskId: p2Tasks[6].id, title: "Studio exterior orbits", completed: true, sortOrder: 1 },
    { taskId: p2Tasks[6].id, title: "Waterfront residence reveal shot", completed: false, sortOrder: 2 },
    { taskId: p2Tasks[6].id, title: "Community center aerial survey", completed: false, sortOrder: 3 },
  ]);

  // ── PROJECT 3 TASKS: Pacific NW Health — Annual Report ──
  const p3Tasks = await db
    .insert(tasksTable)
    .values([
      { projectId: proj3.id, phaseId: p3Pre.id, title: "Brief & data collection", status: "done", assigneeId: kandice.id, progress: 100, sortOrder: 1 },
      { projectId: proj3.id, phaseId: p3Pre.id, title: "Script from annual report doc", status: "done", assigneeId: bri.id, progress: 100, sortOrder: 2 },
      { projectId: proj3.id, phaseId: p3Prod.id, title: "Interview filming — CEO & program leads", status: "done", assigneeId: marcus.id, progress: 100, sortOrder: 3 },
      { projectId: proj3.id, phaseId: p3Post.id, title: "Motion graphics — data viz (6 charts)", status: "done", assigneeId: alex.id, progress: 100, sortOrder: 4 },
      { projectId: proj3.id, phaseId: p3Post.id, title: "Rough cut assembly", status: "done", assigneeId: jamie.id, progress: 100, sortOrder: 5 },
      { projectId: proj3.id, phaseId: p3Post.id, title: "Client review — rough cut", status: "done", assigneeId: kandice.id, progress: 100, sortOrder: 6 },
      { projectId: proj3.id, phaseId: p3Post.id, title: "Revision pass — client notes", status: "done", assigneeId: jamie.id, progress: 100, sortOrder: 7 },
      { projectId: proj3.id, phaseId: p3Post.id, title: "Color grade", status: "done", assigneeId: alex.id, progress: 100, sortOrder: 8 },
      { projectId: proj3.id, phaseId: p3Post.id, title: "Sound mix & music", status: "done", assigneeId: jamie.id, progress: 100, sortOrder: 9 },
      { projectId: proj3.id, phaseId: p3Post.id, title: "Fine cut — client review", status: "in_progress", assigneeId: jamie.id, progress: 80, sortOrder: 10, dueDate: new Date("2026-04-20") },
      { projectId: proj3.id, phaseId: p3Delivery.id, title: "Final QC & master", status: "todo", progress: 0, sortOrder: 11 },
      { projectId: proj3.id, phaseId: p3Delivery.id, title: "Delivery — multiple formats", status: "todo", progress: 0, sortOrder: 12 },
    ])
    .returning();

  await db.insert(taskItemsTable).values([
    { taskId: p3Tasks[9].id, title: "Incorporate Sarah's notes on CEO interview", completed: true, sortOrder: 1 },
    { taskId: p3Tasks[9].id, title: "Update chart #3 with corrected Q4 numbers", completed: true, sortOrder: 2 },
    { taskId: p3Tasks[9].id, title: "Add donor acknowledgment end card", completed: false, sortOrder: 3 },
    { taskId: p3Tasks[9].id, title: "Final approval from Sarah", completed: false, sortOrder: 4 },
  ]);

  // ── PROJECT 4 TASKS: Cascade Coffee — Roastery Series ──
  const p4Tasks = await db
    .insert(tasksTable)
    .values([
      { projectId: proj4.id, phaseId: p4Pre.id, title: "Series concept & episode outlines", status: "done", assigneeId: bri.id, progress: 100, sortOrder: 1 },
      { projectId: proj4.id, phaseId: p4Pre.id, title: "Shot lists per episode", status: "in_progress", assigneeId: bri.id, progress: 50, sortOrder: 2 },
      { projectId: proj4.id, phaseId: p4Pre.id, title: "Location walk-through — Portland roastery", status: "todo", assigneeId: marcus.id, progress: 0, sortOrder: 3, dueDate: new Date("2026-04-25") },
      { projectId: proj4.id, phaseId: p4Prod.id, title: "Ep 1 — Origin (sourcing & green beans)", status: "todo", assigneeId: sam.id, progress: 0, sortOrder: 4 },
      { projectId: proj4.id, phaseId: p4Prod.id, title: "Ep 2 — Roast (the roasting process)", status: "todo", assigneeId: sam.id, progress: 0, sortOrder: 5 },
      { projectId: proj4.id, phaseId: p4Prod.id, title: "Ep 3 — Brew (cafe culture & baristas)", status: "todo", assigneeId: sam.id, progress: 0, sortOrder: 6 },
      { projectId: proj4.id, phaseId: p4Prod.id, title: "Ep 4 — Community (regulars & neighborhood)", status: "todo", assigneeId: sam.id, progress: 0, sortOrder: 7 },
      { projectId: proj4.id, phaseId: p4Prod.id, title: "Photography package (40 stills)", status: "todo", assigneeId: marcus.id, progress: 0, sortOrder: 8 },
      { projectId: proj4.id, phaseId: p4Post.id, title: "Edit & post — all episodes", status: "todo", assigneeId: jamie.id, progress: 0, sortOrder: 9 },
      { projectId: proj4.id, phaseId: p4Post.id, title: "Client review & revisions", status: "todo", progress: 0, sortOrder: 10 },
      { projectId: proj4.id, phaseId: p4Delivery.id, title: "Final delivery — social formats", status: "todo", progress: 0, sortOrder: 11 },
    ])
    .returning();

  await db.insert(taskItemsTable).values([
    { taskId: p4Tasks[1].id, title: "Ep 1 shot list drafted", completed: true, sortOrder: 1 },
    { taskId: p4Tasks[1].id, title: "Ep 2 shot list drafted", completed: false, sortOrder: 2 },
    { taskId: p4Tasks[1].id, title: "Ep 3 shot list drafted", completed: false, sortOrder: 3 },
    { taskId: p4Tasks[1].id, title: "Ep 4 shot list drafted", completed: false, sortOrder: 4 },
    { taskId: p4Tasks[1].id, title: "Photography shot list", completed: false, sortOrder: 5 },
  ]);

  // ── PROJECT 5 TASKS: Vallation — Product Launch (Delivered) ──
  const p5Tasks = await db
    .insert(tasksTable)
    .values([
      { projectId: proj5.id, phaseId: p5Pre.id, title: "Creative direction & moodboard", status: "done", assigneeId: bri.id, progress: 100, sortOrder: 1 },
      { projectId: proj5.id, phaseId: p5Pre.id, title: "Talent & model booking", status: "done", assigneeId: kandice.id, progress: 100, sortOrder: 2 },
      { projectId: proj5.id, phaseId: p5Pre.id, title: "Location permits — North Cascades", status: "done", assigneeId: kandice.id, progress: 100, sortOrder: 3 },
      { projectId: proj5.id, phaseId: p5Prod.id, title: "Shoot day 1 — Alpine ridgeline", status: "done", assigneeId: marcus.id, progress: 100, sortOrder: 4 },
      { projectId: proj5.id, phaseId: p5Prod.id, title: "Shoot day 2 — Forest & river", status: "done", assigneeId: marcus.id, progress: 100, sortOrder: 5 },
      { projectId: proj5.id, phaseId: p5Prod.id, title: "Shoot day 3 — Product flats & studio", status: "done", assigneeId: marcus.id, progress: 100, sortOrder: 6 },
      { projectId: proj5.id, phaseId: p5Prod.id, title: "Drone aerials — all locations", status: "done", assigneeId: sam.id, progress: 100, sortOrder: 7 },
      { projectId: proj5.id, phaseId: p5Post.id, title: "Hero film edit", status: "done", assigneeId: jamie.id, progress: 100, sortOrder: 8 },
      { projectId: proj5.id, phaseId: p5Post.id, title: "Product detail videos (x4)", status: "done", assigneeId: jamie.id, progress: 100, sortOrder: 9 },
      { projectId: proj5.id, phaseId: p5Post.id, title: "Lookbook photo edit (60 stills)", status: "done", assigneeId: alex.id, progress: 100, sortOrder: 10 },
      { projectId: proj5.id, phaseId: p5Post.id, title: "Color grade — all video", status: "done", assigneeId: alex.id, progress: 100, sortOrder: 11 },
      { projectId: proj5.id, phaseId: p5Delivery.id, title: "Client review & final approval", status: "done", assigneeId: kandice.id, progress: 100, sortOrder: 12 },
      { projectId: proj5.id, phaseId: p5Delivery.id, title: "Final delivery — all assets", status: "done", assigneeId: kandice.id, progress: 100, sortOrder: 13 },
    ])
    .returning();

  // ── DELIVERABLES ──
  const deliverables = await db
    .insert(deliverablesTable)
    .values([
      {
        projectId: proj1.id,
        taskId: p1Tasks[9].id,
        title: "Spring Campaign — Fine Cut v1",
        description: "Fine cut of the hero film with temp music and rough grade",
        type: "video",
        status: "in_review",
        version: "v3",
        submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
      {
        projectId: proj1.id,
        title: "Social Cutdowns — 15s Teasers (x3)",
        description: "Three 15-second teaser cuts for Instagram and TikTok",
        type: "video",
        status: "draft",
        version: "v1",
      },
      {
        projectId: proj1.id,
        title: "BTS Photo Selects",
        description: "Behind-the-scenes photography from all shoot days",
        type: "graphics",
        status: "draft",
        version: "v1",
      },
      {
        projectId: proj2.id,
        taskId: p2Tasks[3].id,
        title: "Studio Interview — Raw Assembly",
        description: "Rough assembly of Marcus Tran interview from studio shoot day",
        type: "video",
        status: "approved",
        version: "v1",
        submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        projectId: proj2.id,
        title: "Drone Footage Selects",
        description: "Curated drone shots from studio exterior",
        type: "video",
        status: "in_review",
        version: "v1",
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        projectId: proj3.id,
        taskId: p3Tasks[9].id,
        title: "Annual Report Video — Fine Cut",
        description: "Near-final cut with motion graphics, color, and licensed music",
        type: "video",
        status: "in_review",
        version: "v4",
        submittedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      },
      {
        projectId: proj3.id,
        title: "Motion Graphics Package",
        description: "6 animated data visualizations for the report video",
        type: "graphics",
        status: "approved",
        version: "v2",
        submittedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      },
      {
        projectId: proj5.id,
        title: "Vallation Hero Film — Final Master",
        description: "Final approved hero film for the alpine collection launch",
        type: "video",
        status: "approved",
        version: "v5",
        submittedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        projectId: proj5.id,
        title: "Product Detail Videos (x4)",
        description: "Four 30-second product detail videos for the collection",
        type: "video",
        status: "approved",
        version: "v3",
        submittedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
      },
      {
        projectId: proj5.id,
        title: "Lookbook Photography — 60 Stills",
        description: "Full edited lookbook photography package",
        type: "graphics",
        status: "approved",
        version: "v2",
        submittedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      },
    ])
    .returning();

  // ── REVIEWS ──
  await db.insert(reviewsTable).values([
    {
      deliverableId: deliverables[0].id,
      reviewerId: nicole.id,
      status: "revision_requested",
      comment: "Love the pacing in the first half. The harbor sequence is incredible. Can we tighten the transition at 1:42? The processing facility section feels a bit long — could we trim 10-15 seconds there?",
    },
    {
      deliverableId: deliverables[3].id,
      reviewerId: marcusTran.id,
      status: "approved",
      comment: "This is exactly what I was hoping for. The way you captured the light in the studio is perfect. Approved as-is for the rough cut assembly.",
    },
    {
      deliverableId: deliverables[5].id,
      reviewerId: sarahChen.id,
      status: "pending",
      comment: "Reviewing now — will have notes by end of day Thursday.",
    },
    {
      deliverableId: deliverables[7].id,
      reviewerId: ryanHolt.id,
      status: "approved",
      comment: "Absolutely stunning. The team crushed it. This is going to be our best launch content ever. Sharing with the board today.",
    },
  ]);

  // ── CONTRACTS ──
  await db.insert(contractsTable).values([
    {
      projectId: proj1.id,
      title: "Net Your Problem — Spring Campaign SOW",
      type: "SOW",
      status: "signed",
      amount: 28000,
      signedAt: new Date("2026-01-20"),
    },
    {
      projectId: proj1.id,
      title: "Amendment — Additional Shoot Day",
      type: "Amendment",
      status: "sent",
      amount: 4500,
      sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      projectId: proj2.id,
      title: "Tran Architecture — Founders Story SOW",
      type: "SOW",
      status: "signed",
      amount: 22000,
      signedAt: new Date("2026-03-10"),
    },
    {
      projectId: proj3.id,
      title: "Pacific NW Health — Annual Report SOW",
      type: "SOW",
      status: "signed",
      amount: 15000,
      signedAt: new Date("2026-01-05"),
    },
    {
      projectId: proj4.id,
      title: "Cascade Coffee — Roastery Series SOW",
      type: "SOW",
      status: "sent",
      amount: 18000,
      sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      projectId: proj5.id,
      title: "Vallation Outerwear — Product Launch SOW",
      type: "SOW",
      status: "signed",
      amount: 32000,
      signedAt: new Date("2025-11-10"),
    },
    {
      projectId: proj5.id,
      title: "Vallation — Extended Usage License",
      type: "License",
      status: "signed",
      amount: 5000,
      signedAt: new Date("2026-02-15"),
    },
  ]);

  // ── INVOICES ──
  await db.insert(invoicesTable).values([
    {
      projectId: proj1.id,
      invoiceNumber: "INV-2026-001",
      description: "Spring Campaign — 50% deposit",
      amount: 14000,
      status: "paid",
      dueDate: new Date("2026-02-15"),
      paidAt: new Date("2026-02-12"),
      paymentMethod: "Stripe",
    },
    {
      projectId: proj1.id,
      invoiceNumber: "INV-2026-006",
      description: "Spring Campaign — Post-production milestone",
      amount: 8400,
      status: "sent",
      dueDate: new Date("2026-05-01"),
    },
    {
      projectId: proj1.id,
      invoiceNumber: "INV-2026-009",
      description: "Spring Campaign — Final delivery",
      amount: 5600,
      status: "draft",
      dueDate: new Date("2026-05-20"),
    },
    {
      projectId: proj2.id,
      invoiceNumber: "INV-2026-003",
      description: "Founders Story — 50% deposit",
      amount: 11000,
      status: "paid",
      dueDate: new Date("2026-03-20"),
      paidAt: new Date("2026-03-18"),
      paymentMethod: "Wire Transfer",
    },
    {
      projectId: proj2.id,
      invoiceNumber: "INV-2026-010",
      description: "Founders Story — Production milestone",
      amount: 6600,
      status: "sent",
      dueDate: new Date("2026-05-15"),
    },
    {
      projectId: proj2.id,
      invoiceNumber: "INV-2026-011",
      description: "Founders Story — Final delivery",
      amount: 4400,
      status: "draft",
      dueDate: new Date("2026-07-01"),
    },
    {
      projectId: proj3.id,
      invoiceNumber: "INV-2026-002",
      description: "Annual Report — 50% deposit",
      amount: 7500,
      status: "paid",
      dueDate: new Date("2026-01-20"),
      paidAt: new Date("2026-01-18"),
      paymentMethod: "Stripe",
    },
    {
      projectId: proj3.id,
      invoiceNumber: "INV-2026-007",
      description: "Annual Report — Final delivery",
      amount: 7500,
      status: "sent",
      dueDate: new Date("2026-04-30"),
    },
    {
      projectId: proj4.id,
      invoiceNumber: "INV-2026-008",
      description: "Roastery Series — 50% deposit",
      amount: 9000,
      status: "sent",
      dueDate: new Date("2026-04-15"),
    },
    {
      projectId: proj4.id,
      invoiceNumber: "INV-2026-012",
      description: "Roastery Series — Final delivery",
      amount: 9000,
      status: "draft",
      dueDate: new Date("2026-07-25"),
    },
    {
      projectId: proj5.id,
      invoiceNumber: "INV-2025-015",
      description: "Vallation — 50% deposit",
      amount: 16000,
      status: "paid",
      dueDate: new Date("2025-11-25"),
      paidAt: new Date("2025-11-22"),
      paymentMethod: "Wire Transfer",
    },
    {
      projectId: proj5.id,
      invoiceNumber: "INV-2026-004",
      description: "Vallation — Final delivery",
      amount: 16000,
      status: "paid",
      dueDate: new Date("2026-03-10"),
      paidAt: new Date("2026-03-08"),
      paymentMethod: "Stripe",
    },
    {
      projectId: proj5.id,
      invoiceNumber: "INV-2026-005",
      description: "Vallation — Extended usage license",
      amount: 5000,
      status: "paid",
      dueDate: new Date("2026-02-28"),
      paidAt: new Date("2026-02-25"),
      paymentMethod: "Stripe",
    },
  ]);

  // ── MESSAGES ──
  const now = Date.now();
  await db.insert(messagesTable).values([
    { projectId: proj1.id, senderId: bri.id, content: "Fine cut is coming together nicely. Marcus, the harbor golden hour footage is unreal.", read: true, createdAt: new Date(now - 48 * 60 * 60 * 1000) },
    { projectId: proj1.id, senderId: marcus.id, content: "Thanks! That last setup with the nets was worth the wait. Jamie — I flagged a few selects in the Drive folder for the processing sequence.", read: true, createdAt: new Date(now - 44 * 60 * 60 * 1000) },
    { projectId: proj1.id, senderId: jamie.id, content: "Got them, using the wide angle for the conveyor belt section. Nicole sent revision notes — she wants us to trim the facility walkthrough by about 15s.", read: true, createdAt: new Date(now - 40 * 60 * 60 * 1000) },
    { projectId: proj1.id, senderId: kandice.id, content: "Nicole also asked about adding a short testimonial from one of the deckhands. Bri, do we have that footage?", read: true, createdAt: new Date(now - 36 * 60 * 60 * 1000) },
    { projectId: proj1.id, senderId: bri.id, content: "Yeah we got a great sound bite from Captain Mike. Jamie, it's in the Day 1 folder, around clip 47. Let's try it over the closing sequence.", read: true, createdAt: new Date(now - 32 * 60 * 60 * 1000) },
    { projectId: proj1.id, senderId: alex.id, content: "Primary grade is done on the first half. The underwater shots needed some extra work — the greens were way off. Looking good now though.", read: false, createdAt: new Date(now - 8 * 60 * 60 * 1000) },
    { projectId: proj1.id, senderId: jamie.id, content: "Music licensing came back — we got the track. Laying it in now. Should have the updated fine cut by Friday.", read: false, createdAt: new Date(now - 4 * 60 * 60 * 1000) },

    { projectId: proj2.id, senderId: bri.id, content: "Marcus T. loved the studio interview footage. He said it captured exactly what he was going for.", read: true, createdAt: new Date(now - 72 * 60 * 60 * 1000) },
    { projectId: proj2.id, senderId: marcus.id, content: "Great to hear. The light in that studio was incredible — barely needed any supplemental. Sam, how are the drone shots coming?", read: true, createdAt: new Date(now - 68 * 60 * 60 * 1000) },
    { projectId: proj2.id, senderId: sam.id, content: "Studio orbits are done and look clean. Need to get the waterfront residence shot still — weather has been rough. Targeting Thursday.", read: true, createdAt: new Date(now - 64 * 60 * 60 * 1000) },
    { projectId: proj2.id, senderId: kandice.id, content: "Heads up — Marcus wants to add his business partner to the interview. Would be a short segment. Let me know if that changes anything.", read: false, createdAt: new Date(now - 12 * 60 * 60 * 1000) },
    { projectId: proj2.id, senderId: bri.id, content: "That could actually make the film stronger. Let's schedule 30 min for the partner on the next shoot day. Kandice, can you coordinate?", read: false, createdAt: new Date(now - 6 * 60 * 60 * 1000) },

    { projectId: proj3.id, senderId: jamie.id, content: "Updated the fine cut with Sarah's notes. Chart #3 has the corrected Q4 numbers now. Still need the donor end card copy.", read: true, createdAt: new Date(now - 30 * 60 * 60 * 1000) },
    { projectId: proj3.id, senderId: alex.id, content: "Motion graphics are all approved. I tweaked the color palette slightly to match their updated brand guidelines they sent over.", read: true, createdAt: new Date(now - 26 * 60 * 60 * 1000) },
    { projectId: proj3.id, senderId: kandice.id, content: "Sarah said she'll have final notes by Thursday. Board presentation is the 25th so we're tight on the timeline.", read: false, createdAt: new Date(now - 3 * 60 * 60 * 1000) },

    { projectId: proj4.id, senderId: bri.id, content: "Had a great call with Lena yesterday. She's excited about the series concept. The roastery is beautiful — this is going to look amazing.", read: true, createdAt: new Date(now - 96 * 60 * 60 * 1000) },
    { projectId: proj4.id, senderId: marcus.id, content: "I've been looking at some coffee content for reference. We should lean into the steam and pour shots — that's what performs on Reels.", read: true, createdAt: new Date(now - 92 * 60 * 60 * 1000) },
    { projectId: proj4.id, senderId: bri.id, content: "Totally agree. I'm writing the shot lists now. Ep 1 is done, working on Ep 2. Sam, you'll be lead camera on this one.", read: false, createdAt: new Date(now - 24 * 60 * 60 * 1000) },

    { projectId: proj5.id, senderId: kandice.id, content: "Ryan confirmed all final assets have been downloaded and the team is thrilled. He mentioned wanting to do another project in the fall.", read: true, createdAt: new Date(now - 20 * 24 * 60 * 60 * 1000) },
    { projectId: proj5.id, senderId: bri.id, content: "Amazing. That North Cascades shoot was one of our best. Let's follow up with Ryan in June about the fall collection.", read: true, createdAt: new Date(now - 19 * 24 * 60 * 60 * 1000) },
  ]);

  // ── REVIEW REMINDERS ──
  await db.insert(reviewRemindersTable).values([
    {
      deliverableId: deliverables[0].id,
      reminderDay: 1,
      sentAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
    {
      deliverableId: deliverables[5].id,
      reminderDay: 1,
      sentAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
    },
    {
      deliverableId: deliverables[4].id,
      reminderDay: 1,
      sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    {
      deliverableId: deliverables[4].id,
      reminderDay: 3,
      sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  ]);

  // ── VIDEO COMMENTS (on the fine cut deliverable) ──
  const videoComments = await db
    .insert(videoCommentsTable)
    .values([
      {
        deliverableId: deliverables[0].id,
        authorId: nicole.id,
        authorName: "Nicole Baker",
        timestampSeconds: 12.5,
        content: "Love this opening shot. The fog rolling in over the harbor is perfect.",
      },
      {
        deliverableId: deliverables[0].id,
        authorId: nicole.id,
        authorName: "Nicole Baker",
        timestampSeconds: 47.3,
        content: "Can we hold on this shot a beat longer? The nets coming in is really compelling.",
      },
      {
        deliverableId: deliverables[0].id,
        authorId: nicole.id,
        authorName: "Nicole Baker",
        timestampSeconds: 102.0,
        content: "This transition feels a little abrupt. Maybe a dissolve here instead of the hard cut?",
      },
      {
        deliverableId: deliverables[0].id,
        authorId: bri.id,
        authorName: "Bri Dwyer",
        timestampSeconds: 102.0,
        content: "Agreed, I think a 12-frame dissolve would work well here. Jamie — noted for the next pass.",
      },
      {
        deliverableId: deliverables[0].id,
        authorId: nicole.id,
        authorName: "Nicole Baker",
        timestampSeconds: 135.8,
        content: "The facility walkthrough section is a bit long. Could we trim about 15 seconds somewhere in here?",
      },
    ])
    .returning();

  await db.insert(videoCommentRepliesTable).values([
    {
      commentId: videoComments[1].id,
      authorId: jamie.id,
      authorName: "Jamie Lin",
      content: "Will extend that shot by about 2 seconds in the next cut. Great call.",
    },
    {
      commentId: videoComments[4].id,
      authorId: jamie.id,
      authorName: "Jamie Lin",
      content: "I can cut the conveyor belt section down. There's a natural out point around 1:50 that would save about 12 seconds.",
    },
    {
      commentId: videoComments[4].id,
      authorId: bri.id,
      authorName: "Bri Dwyer",
      content: "That works. We can also tighten the interview cutaway at 2:05 to save a few more seconds.",
    },
  ]);

  console.log("Seed complete!");
  console.log("Test logins:");
  console.log("  Owner:  test@pgtsnd.com       → /team/dashboard");
  console.log("  Crew:   testcrew@pgtsnd.com   → /team/dashboard");
  console.log("  Client: testclient@pgtsnd.com → /client-hub/dashboard");
  console.log("Demo bypass: demo@pgtsnd.com (works on both portals)");
  console.log("5 projects seeded with full data.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
