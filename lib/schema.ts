import { pgTable, uuid, text, timestamp, boolean, numeric, text as textArray } from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").notNull().unique(),
  password: text("password"),
  role: text("role").default("student").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const providers = pgTable("providers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  companyName: text("company_name"),
  contactPerson: text("contact_person"),
  contactNumber: text("contact_number"),
  physicalAddress: text("physical_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const accommodations = pgTable("accommodations", {
  id: uuid("id").primaryKey().defaultRandom(),
  providerId: uuid("provider_id").references(() => providers.id),
  name: text("name"),
  description: text("description"),
  address: text("address"),
  price: numeric("price"),
  status: text("status"),
  images: textArray("images").array(),
  amenities: textArray("amenities").array(),
  type: text("type"),
  nsfas: boolean("nsfas"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})
