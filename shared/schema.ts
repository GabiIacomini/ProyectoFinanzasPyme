import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  companyName: text("company_name").notNull(),
  taxId: text("tax_id"),
  preferredCurrency: text("preferred_currency").default("ARS"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactionCategories = pgTable("transaction_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'income' or 'expense'
  isDefault: boolean("is_default").default(false),
  color: text("color").default("#6B7280"),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  categoryId: varchar("category_id").notNull().references(() => transactionCategories.id),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("ARS"),
  type: text("type").notNull(), // 'income' or 'expense'
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const inflationData = pgTable("inflation_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  rate: decimal("rate", { precision: 5, scale: 2 }).notNull(),
  source: text("source").default("INDEC"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiInsights = pgTable("ai_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'pattern', 'opportunity', 'recommendation', 'alert'
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").default("medium"), // 'low', 'medium', 'high'
  isRead: boolean("is_read").default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cashFlowProjections = pgTable("cash_flow_projections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  projectedIncome: decimal("projected_income", { precision: 15, scale: 2 }).notNull(),
  projectedExpenses: decimal("projected_expenses", { precision: 15, scale: 2 }).notNull(),
  netFlow: decimal("net_flow", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  action: text("action").notNull(), // 'CREATE', 'UPDATE', 'DELETE'
  tableName: text("table_name").notNull(),
  recordId: varchar("record_id"),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'expense_alert', 'business_tip', 'cash_flow_warning', 'payment_reminder', 'goal_achievement'
  title: text("title").notNull(),
  message: text("message").notNull(),
  priority: text("priority").default("medium"), // 'low', 'medium', 'high', 'critical'
  isRead: boolean("is_read").default(false),
  actionUrl: text("action_url"), // URL para acción opcional
  actionText: text("action_text"), // Texto del botón de acción
  metadata: jsonb("metadata"), // Datos adicionales específicos del tipo
  expiresAt: timestamp("expires_at"), // Fecha de expiración opcional
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  transactions: many(transactions),
  aiInsights: many(aiInsights),
  cashFlowProjections: many(cashFlowProjections),
  notifications: many(notifications),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  category: one(transactionCategories, {
    fields: [transactions.categoryId],
    references: [transactionCategories.id],
  }),
}));

export const transactionCategoriesRelations = relations(transactionCategories, ({ many }) => ({
  transactions: many(transactions),
}));

export const aiInsightsRelations = relations(aiInsights, ({ one }) => ({
  user: one(users, {
    fields: [aiInsights.userId],
    references: [users.id],
  }),
}));

export const cashFlowProjectionsRelations = relations(cashFlowProjections, ({ one }) => ({
  user: one(users, {
    fields: [cashFlowProjections.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  companyName: true,
  taxId: true,
  preferredCurrency: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  categoryId: true,
  description: true,
  amount: true,
  currency: true,
  type: true,
  date: true,
}).extend({
  date: z.string().or(z.date()).transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  }),
  amount: z.string().transform((val) => val.toString()),
});

export const insertTransactionCategorySchema = createInsertSchema(transactionCategories).pick({
  name: true,
  type: true,
  color: true,
});

export const insertInflationDataSchema = createInsertSchema(inflationData).pick({
  month: true,
  year: true,
  rate: true,
  source: true,
});

export const insertAiInsightSchema = createInsertSchema(aiInsights).pick({
  type: true,
  title: true,
  description: true,
  priority: true,
  metadata: true,
});

export const insertCashFlowProjectionSchema = createInsertSchema(cashFlowProjections).pick({
  date: true,
  projectedIncome: true,
  projectedExpenses: true,
  netFlow: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  type: true,
  title: true,
  message: true,
  priority: true,
  actionUrl: true,
  actionText: true,
  metadata: true,
  expiresAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).pick({
  action: true,
  tableName: true,
  recordId: true,
  oldValues: true,
  newValues: true,
  ipAddress: true,
  userAgent: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransactionCategory = z.infer<typeof insertTransactionCategorySchema>;
export type TransactionCategory = typeof transactionCategories.$inferSelect;
export type InsertInflationData = z.infer<typeof insertInflationDataSchema>;
export type InflationData = typeof inflationData.$inferSelect;
export type InsertAiInsight = z.infer<typeof insertAiInsightSchema>;
export type AiInsight = typeof aiInsights.$inferSelect;
export type InsertCashFlowProjection = z.infer<typeof insertCashFlowProjectionSchema>;
export type CashFlowProjection = typeof cashFlowProjections.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
