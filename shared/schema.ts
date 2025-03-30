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
  plan: text("plan").default("free")
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
  skills: jsonb("skills"),
  matchScore: integer("match_score"),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertResumeSchema = createInsertSchema(resumes).pick({
  userId: true,
  name: true,
  language: true,
  content: true,
  fileUrl: true,
  skills: true
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
  postedAt: timestamp("posted_at").defaultNow()
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
  source: text("source")
});

export const insertApplicationSchema = createInsertSchema(applications).pick({
  userId: true,
  jobId: true,
  resumeId: true,
  status: true,
  source: true,
  notes: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertResume = z.infer<typeof insertResumeSchema>;
export type Resume = typeof resumes.$inferSelect;

export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applications.$inferSelect;
