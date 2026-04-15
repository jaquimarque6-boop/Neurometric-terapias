import { db } from "@workspace/db";
import { patientsTable, professionalsTable, sessionsTable, goalsTable } from "@workspace/db/schema";

async function seed() {
  console.log("Seeding database...");

  // Clear existing data
  await db.delete(goalsTable);
  await db.delete(sessionsTable);
  await db.delete(patientsTable);
  await db.delete(professionalsTable);

  // Seed professionals
  const professionals = await db.insert(professionalsTable).values([
    { name: "Dr. Sarah Chen", email: "s.chen@neurometric.lab", phone: "(555) 301-2200", specialty: "Cognitive Behavioral Therapy", license: "PSY-8812", status: "active" },
    { name: "Dr. Marcus Rivera", email: "m.rivera@neurometric.lab", phone: "(555) 301-2201", specialty: "Neuropsychology", license: "PSY-7743", status: "active" },
    { name: "Dr. Ava Thompson", email: "a.thompson@neurometric.lab", phone: "(555) 301-2202", specialty: "Trauma & PTSD", license: "PSY-9901", status: "active" },
    { name: "Dr. James Okafor", email: "j.okafor@neurometric.lab", phone: "(555) 301-2203", specialty: "Child & Adolescent Psychiatry", license: "PSY-6654", status: "active" },
  ]).returning();

  console.log(`Seeded ${professionals.length} professionals`);

  // Seed patients
  const patients = await db.insert(patientsTable).values([
    { name: "Elena Vasquez", age: 34, diagnosis: "Major Depressive Disorder", assignedProfessionalId: professionals[0].id },
    { name: "Thomas Park", age: 28, diagnosis: "Generalized Anxiety Disorder", assignedProfessionalId: professionals[0].id },
    { name: "Maria Santos", age: 45, diagnosis: "PTSD", assignedProfessionalId: professionals[2].id },
    { name: "David Kim", age: 19, diagnosis: "ADHD", assignedProfessionalId: professionals[3].id },
    { name: "Rachel Moore", age: 52, diagnosis: "Bipolar Disorder Type II", assignedProfessionalId: professionals[1].id },
    { name: "Carlos Mendez", age: 38, diagnosis: "Social Anxiety Disorder", assignedProfessionalId: professionals[0].id },
    { name: "Aisha Johnson", age: 26, diagnosis: "OCD", assignedProfessionalId: professionals[1].id },
    { name: "Noah Williams", age: 15, diagnosis: "Autism Spectrum Disorder", assignedProfessionalId: professionals[3].id },
  ]).returning();

  console.log(`Seeded ${patients.length} patients`);

  // Seed sessions
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

  const sessions = await db.insert(sessionsTable).values([
    { patientId: patients[0].id, professionalId: professionals[0].id, date: fmt(addDays(today, -6)), duration: 50, type: "individual", notes: "Discussed cognitive distortions and introduced thought records. Patient engaged well.", status: "completed" },
    { patientId: patients[1].id, professionalId: professionals[0].id, date: fmt(addDays(today, -5)), duration: 50, type: "individual", notes: "Worked on relaxation techniques. Patient reported reduced anxiety levels.", status: "completed" },
    { patientId: patients[2].id, professionalId: professionals[2].id, date: fmt(addDays(today, -4)), duration: 60, type: "assessment", notes: "PTSD assessment completed. Developed trauma-focused treatment plan.", status: "completed" },
    { patientId: patients[3].id, professionalId: professionals[3].id, date: fmt(addDays(today, -3)), duration: 45, type: "individual", notes: "ADHD coping strategies discussed. Introduced time management tools.", status: "completed" },
    { patientId: patients[4].id, professionalId: professionals[1].id, date: fmt(addDays(today, -2)), duration: 50, type: "follow-up", notes: "Medication review and mood tracking. Stable period reported.", status: "completed" },
    { patientId: patients[0].id, professionalId: professionals[0].id, date: fmt(today), duration: 50, type: "individual", notes: "", status: "scheduled" },
    { patientId: patients[6].id, professionalId: professionals[1].id, date: fmt(today), duration: 50, type: "individual", notes: "", status: "scheduled" },
    { patientId: patients[7].id, professionalId: professionals[3].id, date: fmt(addDays(today, 1)), duration: 60, type: "assessment", notes: "", status: "scheduled" },
    { patientId: patients[1].id, professionalId: professionals[0].id, date: fmt(addDays(today, 2)), duration: 50, type: "individual", notes: "", status: "scheduled" },
    { patientId: patients[2].id, professionalId: professionals[2].id, date: fmt(addDays(today, 3)), duration: 60, type: "individual", notes: "", status: "scheduled" },
  ]).returning();

  console.log(`Seeded ${sessions.length} sessions`);

  // Seed goals
  const goals = await db.insert(goalsTable).values([
    { patientId: patients[0].id, title: "Reduce negative self-talk frequency", description: "Track and challenge negative automatic thoughts using CBT worksheets daily", category: "cognitive", status: "in-progress", targetDate: fmt(addDays(today, 60)) },
    { patientId: patients[0].id, title: "Establish consistent sleep routine", description: "Maintain 7-8 hours of sleep per night with consistent sleep/wake times", category: "behavioral", status: "in-progress", targetDate: fmt(addDays(today, 30)) },
    { patientId: patients[1].id, title: "Practice daily mindfulness meditation", description: "Complete 10-minute mindfulness sessions each morning", category: "emotional", status: "achieved", targetDate: fmt(addDays(today, -10)) },
    { patientId: patients[1].id, title: "Reduce avoidance behaviors", description: "Gradually engage in previously avoided social situations using exposure hierarchy", category: "behavioral", status: "in-progress", targetDate: fmt(addDays(today, 45)) },
    { patientId: patients[2].id, title: "Process traumatic memories safely", description: "Work through EMDR protocol for primary trauma", category: "emotional", status: "in-progress", targetDate: fmt(addDays(today, 90)) },
    { patientId: patients[3].id, title: "Improve focus during study sessions", description: "Use Pomodoro technique and fidget tools to maintain 25-min focused work blocks", category: "cognitive", status: "in-progress", targetDate: fmt(addDays(today, 30)) },
    { patientId: patients[4].id, title: "Mood journaling habit", description: "Complete daily mood log with triggers and coping responses", category: "emotional", status: "achieved", targetDate: fmt(addDays(today, -20)) },
    { patientId: patients[6].id, title: "Reduce compulsive checking behaviors", description: "Decrease checking rituals from 20x to 5x per day over 8 weeks", category: "behavioral", status: "in-progress", targetDate: fmt(addDays(today, 55)) },
    { patientId: patients[7].id, title: "Expand social interaction comfort zone", description: "Participate in structured peer interaction activities twice weekly", category: "social", status: "pending", targetDate: fmt(addDays(today, 120)) },
    { patientId: patients[5].id, title: "Attend one social event monthly", description: "Gradually increase social exposure starting with small, familiar groups", category: "social", status: "discontinued", targetDate: fmt(addDays(today, -5)) },
  ]).returning();

  console.log(`Seeded ${goals.length} goals`);
  console.log("Seeding complete!");
}

seed().catch(console.error).finally(() => process.exit(0));
