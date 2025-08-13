/**
 * @fileoverview Prisma database client configuration and export.
 * Provides a centralized Prisma client instance for database operations.
 *
 * @author abhisekadhikari
 * @version 1.0.0
 */

import { PrismaClient } from "@prisma/client";

/**
 * Prisma database client instance
 * Provides access to database operations for all models defined in the Prisma schema
 *
 * @type {PrismaClient}
 * @description
 * This is a singleton instance of PrismaClient that should be used throughout
 * the application for all database operations. It includes connection pooling
 * and automatic connection management.
 *
 * @example
 * // Usage in controllers or services:
 * import { prisma } from '../utils/prisma';
 *
 * const users = await prisma.user.findMany();
 * const newUser = await prisma.user.create({ data: { name: 'John', email: 'john@example.com' } });
 */
export const prisma = new PrismaClient();
