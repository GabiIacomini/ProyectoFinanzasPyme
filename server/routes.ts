import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertTransactionSchema,
  insertTransactionCategorySchema,
  insertInflationDataSchema,
  insertAiInsightSchema,
  insertCashFlowProjectionSchema,
  insertUserSchema,
  insertNotificationSchema
} from "@shared/schema";
import { z } from "zod";
import { authenticateToken, optionalAuth, generateToken, hashPassword, comparePassword, type AuthRequest } from "./auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Test route
  app.get("/api/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
  });

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "El usuario ya existe con este email" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(userData.password);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email,
      });

      res.status(201).json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          companyName: user.companyName,
          preferredCurrency: user.preferredCurrency,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      } else {
        console.error("Error registering user:", error);
        res.status(500).json({ message: "Error interno del servidor" });
      }
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      // Verify password
      const validPassword = await comparePassword(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email,
      });

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          companyName: user.companyName,
          preferredCurrency: user.preferredCurrency,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      } else {
        console.error("Error logging in:", error);
        res.status(500).json({ message: "Error interno del servidor" });
      }
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        companyName: user.companyName,
        preferredCurrency: user.preferredCurrency,
      });
    } catch (error) {
      console.error("Error getting user profile:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Dashboard data endpoint - now with authentication
  app.get("/api/dashboard/:userId", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const [
        currentBalance,
        monthlyIncome,
        monthlyExpenses,
        recentTransactions,
        expensesByCategory,
        aiInsights,
        cashFlowProjections,
        inflationRate
      ] = await Promise.all([
        storage.getUserCurrentBalance(userId),
        storage.getUserMonthlyIncome(userId, currentMonth, currentYear),
        storage.getUserMonthlyExpenses(userId, currentMonth, currentYear),
        storage.getUserTransactions(userId, 10),
        storage.getUserExpensesByCategory(userId, currentMonth, currentYear),
        storage.getUserAiInsights(userId, 3),
        storage.getUserCashFlowProjections(userId, 8),
        storage.getLatestInflationRate()
      ]);

      res.json({
        currentBalance,
        monthlyIncome,
        monthlyExpenses,
        recentTransactions,
        expensesByCategory,
        aiInsights,
        cashFlowProjections,
        inflationRate: inflationRate?.rate || '0'
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Error fetching dashboard data" });
    }
  });

  // Transaction routes - now with authentication
  app.get("/api/transactions/:userId", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const transactions = await storage.getUserTransactions(userId, limit);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Error fetching transactions" });
    }
  });

  app.post("/api/transactions/:userId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      const transactionData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(userId, transactionData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      } else {
        console.error("Error creating transaction:", error);
        res.status(500).json({ message: "Error creating transaction" });
      }
    }
  });

  // Transaction categories
  app.get("/api/transaction-categories", async (req, res) => {
    try {
      const categories = await storage.getTransactionCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Error fetching categories" });
    }
  });

  app.post("/api/transaction-categories", async (req, res) => {
    try {
      const categoryData = insertTransactionCategorySchema.parse(req.body);
      const category = await storage.createTransactionCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid category data", errors: error.errors });
      } else {
        console.error("Error creating category:", error);
        res.status(500).json({ message: "Error creating category" });
      }
    }
  });

  // AI Insights
  app.get("/api/ai-insights/:userId", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      const insights = await storage.getUserAiInsights(userId);
      res.json(insights);
    } catch (error) {
      console.error("Error fetching AI insights:", error);
      res.status(500).json({ message: "Error fetching AI insights" });
    }
  });

  app.post("/api/ai-insights/:userId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      const insightData = insertAiInsightSchema.parse(req.body);
      const insight = await storage.createAiInsight(userId, insightData);
      res.status(201).json(insight);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid insight data", errors: error.errors });
      } else {
        console.error("Error creating AI insight:", error);
        res.status(500).json({ message: "Error creating AI insight" });
      }
    }
  });

  // Cash flow projections
  app.get("/api/cash-flow-projections/:userId", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      const projections = await storage.getUserCashFlowProjections(userId);
      res.json(projections);
    } catch (error) {
      console.error("Error fetching projections:", error);
      res.status(500).json({ message: "Error fetching projections" });
    }
  });

  app.post("/api/cash-flow-projections/:userId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      const projectionData = insertCashFlowProjectionSchema.parse(req.body);
      const projection = await storage.createCashFlowProjection(userId, projectionData);
      res.status(201).json(projection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid projection data", errors: error.errors });
      } else {
        console.error("Error creating projection:", error);
        res.status(500).json({ message: "Error creating projection" });
      }
    }
  });

  // Inflation data
  app.get("/api/inflation/latest", async (req, res) => {
    try {
      const inflationRate = await storage.getLatestInflationRate();
      res.json(inflationRate);
    } catch (error) {
      console.error("Error fetching inflation data:", error);
      res.status(500).json({ message: "Error fetching inflation data" });
    }
  });

  app.post("/api/inflation", async (req, res) => {
    try {
      const inflationData = insertInflationDataSchema.parse(req.body);
      const data = await storage.createInflationData(inflationData);
      res.status(201).json(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid inflation data", errors: error.errors });
      } else {
        console.error("Error creating inflation data:", error);
        res.status(500).json({ message: "Error creating inflation data" });
      }
    }
  });

  // Notifications routes
  app.get("/api/notifications/:userId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;

      // Verify user can access these notifications
      if (req.userId !== userId) {
        return res.status(403).json({ message: "No autorizado" });
      }

      const notifications = await storage.getUserNotifications(userId, limit);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Error al obtener notificaciones" });
    }
  });

  app.get("/api/notifications/:userId/count", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;

      if (req.userId !== userId) {
        return res.status(403).json({ message: "No autorizado" });
      }

      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching notification count:", error);
      res.status(500).json({ message: "Error al contar notificaciones" });
    }
  });

  app.post("/api/notifications/:userId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;

      if (req.userId !== userId) {
        return res.status(403).json({ message: "No autorizado" });
      }

      const notificationData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(userId, notificationData);
      res.status(201).json(notification);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Datos de notificación inválidos", errors: error.errors });
      } else {
        console.error("Error creating notification:", error);
        res.status(500).json({ message: "Error al crear notificación" });
      }
    }
  });

  app.patch("/api/notifications/:notificationId/read", authenticateToken, async (req: AuthRequest, res) => {
    try {.
      const { notificationId } = req.params;
      await storage.markNotificationAsRead(notificationId);
      res.json({ message: "Notificación marcada como leída" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Error al marcar notificación" });
    }
  });

  app.patch("/api/notifications/:userId/read-all", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;

      if (req.userId !== userId) {
        return res.status(403).json({ message: "No autorizado" });
      }

      await storage.markAllNotificationsAsRead(userId);
      res.json({ message: "Todas las notificaciones marcadas como leídas" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Error al marcar todas las notificaciones" });
    }
  });

  app.delete("/api/notifications/:notificationId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { notificationId } = req.params;
      await storage.deleteNotification(notificationId);
      res.json({ message: "Notificación eliminada" });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "Error al eliminar notificación" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
