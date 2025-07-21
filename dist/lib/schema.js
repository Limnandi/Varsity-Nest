"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accommodations = exports.providers = exports.users = void 0;
var pg_core_1 = require("drizzle-orm/pg-core");
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    name: (0, pg_core_1.text)("name"),
    email: (0, pg_core_1.text)("email").notNull().unique(),
    password: (0, pg_core_1.text)("password"),
    role: (0, pg_core_1.text)("role").default("student").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
exports.providers = (0, pg_core_1.pgTable)("providers", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id").references(function () { return exports.users.id; }),
    companyName: (0, pg_core_1.text)("company_name"),
    contactPerson: (0, pg_core_1.text)("contact_person"),
    contactNumber: (0, pg_core_1.text)("contact_number"),
    physicalAddress: (0, pg_core_1.text)("physical_address"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
exports.accommodations = (0, pg_core_1.pgTable)("accommodations", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    providerId: (0, pg_core_1.uuid)("provider_id").references(function () { return exports.providers.id; }),
    name: (0, pg_core_1.text)("name"),
    description: (0, pg_core_1.text)("description"),
    address: (0, pg_core_1.text)("address"),
    price: (0, pg_core_1.numeric)("price"),
    status: (0, pg_core_1.text)("status"),
    images: (0, pg_core_1.text)("images").array(),
    amenities: (0, pg_core_1.text)("amenities").array(),
    type: (0, pg_core_1.text)("type"),
    nsfas: (0, pg_core_1.boolean)("nsfas"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
});
