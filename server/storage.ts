import {
  users,
  transactions,
  transactionCategories,
  inflationData,
  aiInsights,
  cashFlowProjections,
  auditLogs,
  notifications,
  type User,
  type InsertUser,
  type Transaction,
  type InsertTransaction,
  type TransactionCategory,
  type InsertTransactionCategory,
  type InflationData,
  type InsertInflationData,
  type AiInsight,
  type InsertAiInsight,
  type CashFlowProjection,
  type InsertCashFlowProjection,
  type AuditLog,
  type InsertAuditLog,
  type Notification,
  type InsertNotification
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Transaction Categories
  getTransactionCategories(): Promise<TransactionCategory[]>;
  createTransactionCategory(category: InsertTransactionCategory): Promise<TransactionCategory>;

  // Transactions
  getUserTransactions(userId: string, limit?: number): Promise<Transaction[]>;
  createTransaction(userId: string, transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Transaction[]>;

  // Financial Analytics
  getUserMonthlyIncome(userId: string, month: number, year: number): Promise<string>;
  getUserMonthlyExpenses(userId: string, month: number, year: number): Promise<string>;
  getUserCurrentBalance(userId: string): Promise<string>;
  getUserExpensesByCategory(userId: string, month: number, year: number): Promise<{ categoryName: string; amount: string; color: string }[]>;

  // Inflation Data
  getLatestInflationRate(): Promise<InflationData | undefined>;
  createInflationData(data: InsertInflationData): Promise<InflationData>;

  // AI Insights
  getUserAiInsights(userId: string, limit?: number): Promise<AiInsight[]>;
  createAiInsight(userId: string, insight: InsertAiInsight): Promise<AiInsight>;
  markInsightAsRead(insightId: string): Promise<void>;

  // Cash Flow Projections
  getUserCashFlowProjections(userId: string, limit?: number): Promise<CashFlowProjection[]>;
  createCashFlowProjection(userId: string, projection: InsertCashFlowProjection): Promise<CashFlowProjection>;

  // Audit Logs
  createAuditLog(userId: string | null, audit: InsertAuditLog): Promise<AuditLog>;
  getUserAuditLogs(userId: string, limit?: number): Promise<AuditLog[]>;

  // Notifications
  getUserNotifications(userId: string, limit?: number): Promise<Notification[]>;
  createNotification(userId: string, notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(notificationId: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  deleteNotification(notificationId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Transaction Categories
  async getTransactionCategories(): Promise<TransactionCategory[]> {
    return await db.select().from(transactionCategories);
  }

  async createTransactionCategory(category: InsertTransactionCategory): Promise<TransactionCategory> {
    const [newCategory] = await db
      .insert(transactionCategories)
      .values(category)
      .returning();
    return newCategory;
  }

  // Transactions
  async getUserTransactions(userId: string, limit = 50): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date))
      .limit(limit);
  }

  async createTransaction(userId: string, transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values({ ...transaction, userId })
      .returning();
    return newTransaction;
  }

  async getTransactionsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      )
      .orderBy(desc(transactions.date));
  }

  // Financial Analytics
  async getUserMonthlyIncome(userId: string, month: number, year: number): Promise<string> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const [result] = await db
      .select({ total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'income'),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      );

    return result?.total || '0';
  }

  async getUserMonthlyExpenses(userId: string, month: number, year: number): Promise<string> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const [result] = await db
      .select({ total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'expense'),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      );

    return result?.total || '0';
  }

  async getUserCurrentBalance(userId: string): Promise<string> {
    const [incomeResult] = await db
      .select({ total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'income')
        )
      );

    const [expenseResult] = await db
      .select({ total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)` })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'expense')
        )
      );

    const income = parseFloat(incomeResult?.total || '0');
    const expenses = parseFloat(expenseResult?.total || '0');

    return (income - expenses).toString();
  }

  async getUserExpensesByCategory(userId: string, month: number, year: number): Promise<{ categoryName: string; amount: string; color: string }[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const results = await db
      .select({
        categoryName: transactionCategories.name,
        amount: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
        color: transactionCategories.color
      })
      .from(transactions)
      .innerJoin(transactionCategories, eq(transactions.categoryId, transactionCategories.id))
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'expense'),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      )
      .groupBy(transactionCategories.name, transactionCategories.color);

    return results.map(result => ({
      ...result,
      color: result.color || '#6B7280' // Provide default color if null
    }));
  }

  // Inflation Data
  async getLatestInflationRate(): Promise<InflationData | undefined> {
    const [inflationRate] = await db
      .select()
      .from(inflationData)
      .orderBy(desc(inflationData.year), desc(inflationData.month))
      .limit(1);

    return inflationRate || undefined;
  }

  async createInflationData(data: InsertInflationData): Promise<InflationData> {
    const [newInflationData] = await db
      .insert(inflationData)
      .values(data)
      .returning();
    return newInflationData;
  }

  // AI Insights
  async getUserAiInsights(userId: string, limit = 10): Promise<AiInsight[]> {
    return await db
      .select()
      .from(aiInsights)
      .where(eq(aiInsights.userId, userId))
      .orderBy(desc(aiInsights.createdAt))
      .limit(limit);
  }

  async createAiInsight(userId: string, insight: InsertAiInsight): Promise<AiInsight> {
    const [newInsight] = await db
      .insert(aiInsights)
      .values({ ...insight, userId })
      .returning();
    return newInsight;
  }

  async markInsightAsRead(insightId: string): Promise<void> {
    await db
      .update(aiInsights)
      .set({ isRead: true })
      .where(eq(aiInsights.id, insightId));
  }

  // Cash Flow Projections
  async getUserCashFlowProjections(userId: string, limit = 30): Promise<CashFlowProjection[]> {
    return await db
      .select()
      .from(cashFlowProjections)
      .where(eq(cashFlowProjections.userId, userId))
      .orderBy(desc(cashFlowProjections.date))
      .limit(limit);
  }

  async createCashFlowProjection(userId: string, projection: InsertCashFlowProjection): Promise<CashFlowProjection> {
    const [newProjection] = await db
      .insert(cashFlowProjections)
      .values({ ...projection, userId })
      .returning();
    return newProjection;
  }

  // Audit Logs
  async createAuditLog(userId: string | null, audit: InsertAuditLog): Promise<AuditLog> {
    const [newAuditLog] = await db
      .insert(auditLogs)
      .values({ ...audit, userId })
      .returning();
    return newAuditLog;
  }

  async getUserAuditLogs(userId: string, limit = 50): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.userId, userId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
  }

  // Notifications
  async getUserNotifications(userId: string, limit = 20): Promise<Notification[]> {
    const now = new Date();
    return await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          sql`(${notifications.expiresAt} IS NULL OR ${notifications.expiresAt} > ${now})`
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async createNotification(userId: string, notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values({ ...notification, userId })
      .returning();
    return newNotification;
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const now = new Date();
    const result = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false),
          sql`(${notifications.expiresAt} IS NULL OR ${notifications.expiresAt} > ${now})`
        )
      );

    return result[0]?.count || 0;
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await db
      .delete(notifications)
      .where(eq(notifications.id, notificationId));
  }
}

export const storage = new DatabaseStorage();
