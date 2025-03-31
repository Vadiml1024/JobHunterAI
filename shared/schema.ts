import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  email: text("email"),
  avatar: text("avatar"),
  plan: text("plan").default("free"),
  linkedinProfile: text("linkedin_profile"),
  linkedinData: jsonb("linkedin_data"),
  calendarIntegration: boolean("calendar_integration").default(false),
  googleRefreshToken: text("google_refresh_token")
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true
});

export const resumes = pgTable("resumes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  language: text("language").notNull(),
  content: text("content"),
  fileUrl: text("file_url"),
  skills: jsonb("skills").default({}),
  summary: text("summary"),
  experience: jsonb("experience"),
  education: jsonb("education"),
  matchScore: integer("match_score"),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertResumeSchema = createInsertSchema(resumes).pick({
  userId: true,
  name: true,
  language: true,
  content: true,
  fileUrl: true,
  skills: true,
  summary: true,
  experience: true,
  education: true,
  matchScore: true
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  company: text("company").notNull(),
  location: text("location"),
  description: text("description"),
  salary: text("salary"),
  jobType: text("job_type"),
  skills: jsonb("skills"),
  source: text("source"),
  remoteOption: text("remote_option"),
  matchScore: integer("match_score"),
  postedAt: timestamp("posted_at").defaultNow(),
  url: text("url")
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true
});

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  jobId: integer("job_id").notNull(),
  resumeId: integer("resume_id"),
  status: text("status").default("applied"),
  appliedAt: timestamp("applied_at").defaultNow(),
  notes: text("notes"),
  source: text("source"),
  calendarEventId: text("calendar_event_id"),
  deadlineDate: timestamp("deadline_date"),
  interviewDate: timestamp("interview_date"),
  isCalendarSynced: boolean("is_calendar_synced").default(false)
});

export const insertApplicationSchema = createInsertSchema(applications).pick({
  userId: true,
  jobId: true,
  resumeId: true,
  status: true,
  source: true,
  notes: true,
  deadlineDate: true,
  interviewDate: true,
  calendarEventId: true,
  isCalendarSynced: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertResume = z.infer<typeof insertResumeSchema>;
export type Resume = typeof resumes.$inferSelect;

export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

export const jobSources = pgTable("job_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  url: text("url"),
  apiKey: text("api_key"),
  isEnabled: boolean("is_enabled").default(true),
  lastSync: timestamp("last_sync"),
  configOptions: jsonb("config_options")
});

export const insertJobSourceSchema = createInsertSchema(jobSources).omit({
  id: true
});

export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applications.$inferSelect;

export type InsertJobSource = z.infer<typeof insertJobSourceSchema>;
export type JobSource = typeof jobSources.$inferSelect;
