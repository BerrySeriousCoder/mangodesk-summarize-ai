import { pgTable, text, timestamp, uuid, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// File metadata table
export const files = pgTable('files', {
  id: uuid('id').primaryKey().defaultRandom(),
  originalName: text('original_name').notNull(),
  fileName: text('file_name').notNull(),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: text('mime_type').notNull(),
  wordCount: integer('word_count').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Summary table
export const summaries = pgTable('summaries', {
  id: uuid('id').primaryKey().defaultRandom(),
  fileId: uuid('file_id').references(() => files.id, { onDelete: 'cascade' }).notNull(),
  originalPrompt: text('original_prompt').notNull(),
  content: text('content').notNull(),
  version: integer('version').notNull().default(1),
  isActive: boolean('is_active').notNull().default(true),
  tokensUsed: integer('tokens_used'),
  model: text('model'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Summary versions table for history
export const summaryVersions = pgTable('summary_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  summaryId: uuid('summary_id').references(() => summaries.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  prompt: text('prompt').notNull(),
  version: integer('version').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Email requests table
export const emailRequests = pgTable('email_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  summaryId: uuid('summary_id').references(() => summaries.id, { onDelete: 'cascade' }).notNull(),
  recipientEmail: text('recipient_email').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull().default('pending'), // pending, sent, failed
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const filesRelations = relations(files, ({ many }) => ({
  summaries: many(summaries),
}));

export const summariesRelations = relations(summaries, ({ one, many }) => ({
  file: one(files, {
    fields: [summaries.fileId],
    references: [files.id],
  }),
  versions: many(summaryVersions),
  emailRequests: many(emailRequests),
}));

export const summaryVersionsRelations = relations(summaryVersions, ({ one }) => ({
  summary: one(summaries, {
    fields: [summaryVersions.summaryId],
    references: [summaries.id],
  }),
}));

export const emailRequestsRelations = relations(emailRequests, ({ one }) => ({
  summary: one(summaries, {
    fields: [emailRequests.summaryId],
    references: [summaries.id],
  }),
})); 