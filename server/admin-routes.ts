import type { Express } from "express";
import { adminStorage } from "./admin-storage";
import session from "express-session";
import connectPg from "connect-pg-simple";

// Admin session configuration
export function getAdminSession() {
  const sessionTtl = 24 * 60 * 60 * 1000; // 24 hours
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "admin_sessions",
  });
  
  return session({
    name: "fleet-admin-session",
    secret: process.env.SESSION_SECRET || "fleet-admin-secret-key",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

// Admin authentication middleware
export function requireAdminAuth(req: any, res: any, next: any) {
  if (!req.session?.adminId) {
    return res.status(401).json({ message: "Admin authentication required" });
  }
  next();
}

export function setupAdminRoutes(app: Express) {
  // Admin session middleware
  app.use("/api/admin", getAdminSession());

  // Admin authentication routes
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password required" });
      }

      const admin = await adminStorage.validateAdminPassword(email, password);
      if (!admin) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.adminId = admin.id;
      req.session.adminEmail = admin.email;
      
      res.json({
        id: admin.id,
        email: admin.email,
        name: admin.name,
        permissions: admin.permissions,
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/admin/me", requireAdminAuth, async (req, res) => {
    try {
      const admin = await adminStorage.getAdminById(req.session.adminId);
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      res.json({
        id: admin.id,
        email: admin.email,
        name: admin.name,
        permissions: admin.permissions,
        lastLoginAt: admin.lastLoginAt,
      });
    } catch (error) {
      console.error("Admin profile error:", error);
      res.status(500).json({ message: "Failed to get admin profile" });
    }
  });

  // Dashboard overview routes
  app.get("/api/admin/dashboard/overview", requireAdminAuth, async (req, res) => {
    try {
      const overview = await adminStorage.getSystemOverview();
      res.json(overview);
    } catch (error) {
      console.error("Dashboard overview error:", error);
      res.status(500).json({ message: "Failed to get system overview" });
    }
  });

  app.get("/api/admin/dashboard/tenants", requireAdminAuth, async (req, res) => {
    try {
      const tenantStats = await adminStorage.getTenantStats();
      res.json(tenantStats);
    } catch (error) {
      console.error("Tenant stats error:", error);
      res.status(500).json({ message: "Failed to get tenant statistics" });
    }
  });

  // Usage analytics routes
  app.get("/api/admin/analytics/usage", requireAdminAuth, async (req, res) => {
    try {
      const { startDate, endDate, tenantId } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date required" });
      }

      let analytics;
      if (tenantId) {
        analytics = await adminStorage.getTenantUsageAnalytics(
          tenantId as string,
          startDate as string,
          endDate as string
        );
      } else {
        analytics = await adminStorage.getUsageAnalytics(
          startDate as string,
          endDate as string
        );
      }

      res.json(analytics);
    } catch (error) {
      console.error("Usage analytics error:", error);
      res.status(500).json({ message: "Failed to get usage analytics" });
    }
  });

  // Pricing management routes
  app.get("/api/admin/pricing/tiers", requireAdminAuth, async (req, res) => {
    try {
      const tiers = await adminStorage.getPricingTiers();
      res.json(tiers);
    } catch (error) {
      console.error("Get pricing tiers error:", error);
      res.status(500).json({ message: "Failed to get pricing tiers" });
    }
  });

  app.post("/api/admin/pricing/tiers", requireAdminAuth, async (req, res) => {
    try {
      const { name, description, pricePerDriver, minDrivers, maxDrivers, features } = req.body;
      
      if (!name || !pricePerDriver || !minDrivers) {
        return res.status(400).json({ message: "Name, price per driver, and minimum drivers required" });
      }

      const tier = await adminStorage.createPricingTier({
        name,
        description,
        pricePerDriver: Number(pricePerDriver),
        minDrivers: Number(minDrivers),
        maxDrivers: maxDrivers ? Number(maxDrivers) : null,
        features: features || [],
        isActive: true,
      });

      res.status(201).json(tier);
    } catch (error) {
      console.error("Create pricing tier error:", error);
      res.status(500).json({ message: "Failed to create pricing tier" });
    }
  });

  app.put("/api/admin/pricing/tiers/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      if (updates.pricePerDriver) {
        updates.pricePerDriver = Number(updates.pricePerDriver);
      }
      if (updates.minDrivers) {
        updates.minDrivers = Number(updates.minDrivers);
      }
      if (updates.maxDrivers) {
        updates.maxDrivers = Number(updates.maxDrivers);
      }

      const tier = await adminStorage.updatePricingTier(id, updates);
      res.json(tier);
    } catch (error) {
      console.error("Update pricing tier error:", error);
      res.status(500).json({ message: "Failed to update pricing tier" });
    }
  });

  app.delete("/api/admin/pricing/tiers/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await adminStorage.deletePricingTier(id);
      res.json({ message: "Pricing tier deactivated successfully" });
    } catch (error) {
      console.error("Delete pricing tier error:", error);
      res.status(500).json({ message: "Failed to deactivate pricing tier" });
    }
  });

  // Billing management routes
  app.get("/api/admin/billing/records", requireAdminAuth, async (req, res) => {
    try {
      const { limit, tenantId } = req.query;
      
      let records;
      if (tenantId) {
        records = await adminStorage.getTenantBillingRecords(tenantId as string);
      } else {
        records = await adminStorage.getBillingRecords(limit ? Number(limit) : 100);
      }

      res.json(records);
    } catch (error) {
      console.error("Get billing records error:", error);
      res.status(500).json({ message: "Failed to get billing records" });
    }
  });

  app.put("/api/admin/billing/records/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const record = await adminStorage.updateBillingRecord(id, updates);
      res.json(record);
    } catch (error) {
      console.error("Update billing record error:", error);
      res.status(500).json({ message: "Failed to update billing record" });
    }
  });

  // System configuration routes
  app.get("/api/admin/system/config", requireAdminAuth, async (req, res) => {
    try {
      const { key } = req.query;
      
      if (key) {
        const config = await adminStorage.getSystemConfig(key as string);
        if (!config) {
          return res.status(404).json({ message: "Configuration not found" });
        }
        res.json(config);
      } else {
        const configs = await adminStorage.getAllSystemConfig();
        res.json(configs);
      }
    } catch (error) {
      console.error("Get system config error:", error);
      res.status(500).json({ message: "Failed to get system configuration" });
    }
  });

  app.post("/api/admin/system/config", requireAdminAuth, async (req, res) => {
    try {
      const { key, value, description } = req.body;
      
      if (!key || !value) {
        return res.status(400).json({ message: "Key and value required" });
      }

      const config = await adminStorage.setSystemConfig({
        key,
        value,
        description,
        updatedBy: req.session.adminId,
      });

      res.json(config);
    } catch (error) {
      console.error("Set system config error:", error);
      res.status(500).json({ message: "Failed to set system configuration" });
    }
  });

  // Health check for admin system
  app.get("/api/admin/health", (req, res) => {
    res.json({
      status: "healthy",
      service: "Fleet.Chat Admin API",
      timestamp: new Date().toISOString(),
    });
  });
}