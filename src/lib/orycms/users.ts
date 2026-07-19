import bcrypt from "bcryptjs"
import { orycmsPrisma } from "@/lib/orycms/prisma"

export type OryCMSAdminRole = "Owner" | "Super Admin" | "Admin" | "Editor" | "Manager" | "Support" | "Custom"
export type OryCMSAdminStatus = "active" | "inactive"

export type CurrentOryCMSAdmin = {
  id: string
  roleName: string
}

export type OryCMSAdminUserDTO = {
  createdAt: string
  deletedAt: string | null
  email: string
  emailVerified: boolean
  fullName: string
  id: string
  lastLoginAt: string | null
  mobileNumber: string
  profilePhoto: string | null
  role: OryCMSAdminRole
  status: OryCMSAdminStatus
  updatedAt: string
  username: string
}

type AdminUserRow = {
  createdAt: Date | string
  deletedAt: Date | string | null
  email: string
  emailVerified: boolean | null
  fullName: string | null
  id: string
  lastLoginAt: Date | string | null
  mobileNumber: string | null
  profilePhoto: string | null
  roleName: string | null
  status: string
  updatedAt: Date | string
  username: string | null
}

type UserInput = {
  confirmPassword?: string
  email?: string
  emailVerified?: boolean
  fullName?: string
  mobileNumber?: string
  password?: string
  profilePhoto?: string | null
  role?: OryCMSAdminRole
  status?: OryCMSAdminStatus
  username?: string
}

const ADMIN_ROLES: OryCMSAdminRole[] = ["Super Admin", "Admin", "Editor", "Manager", "Support", "Custom"]
let schemaReady: Promise<void> | null = null
const USER_SELECT = `
  u.id,
  u.email,
  u.status,
  u."createdAt",
  u."updatedAt",
  u."deletedAt",
  u."fullName",
  u."mobileNumber",
  u."profilePhoto",
  u.username,
  u."emailVerified",
  u."lastLoginAt",
  r.name AS "roleName"
`

export async function ensureOryCMSAdminUserSchema() {
  schemaReady ??= ensureOryCMSAdminUserSchemaOnce().catch((error) => {
    schemaReady = null
    throw error
  })
  return schemaReady
}

async function ensureOryCMSAdminUserSchemaOnce() {
  await orycmsPrisma.$executeRawUnsafe(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    CREATE TABLE IF NOT EXISTS orycms_roles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS orycms_users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text NOT NULL UNIQUE,
      "passwordHash" text NOT NULL,
      status text NOT NULL DEFAULT 'active',
      "roleId" uuid REFERENCES orycms_roles(id),
      "createdAt" timestamptz NOT NULL DEFAULT now()
    );
    ALTER TABLE orycms_users ADD COLUMN IF NOT EXISTS "fullName" text;
    ALTER TABLE orycms_users ADD COLUMN IF NOT EXISTS "mobileNumber" text;
    ALTER TABLE orycms_users ADD COLUMN IF NOT EXISTS "profilePhoto" text;
    ALTER TABLE orycms_users ADD COLUMN IF NOT EXISTS username text;
    ALTER TABLE orycms_users ADD COLUMN IF NOT EXISTS "emailVerified" boolean NOT NULL DEFAULT false;
    ALTER TABLE orycms_users ADD COLUMN IF NOT EXISTS "lastLoginAt" timestamptz;
    ALTER TABLE orycms_users ADD COLUMN IF NOT EXISTS "deletedAt" timestamptz;
    ALTER TABLE orycms_users ADD COLUMN IF NOT EXISTS "updatedAt" timestamptz NOT NULL DEFAULT now();
    CREATE INDEX IF NOT EXISTS orycms_users_deleted_at_idx ON orycms_users ("deletedAt");
    CREATE INDEX IF NOT EXISTS orycms_users_status_idx ON orycms_users (status);
    CREATE UNIQUE INDEX IF NOT EXISTS orycms_users_username_active_idx ON orycms_users (lower(username)) WHERE username IS NOT NULL AND "deletedAt" IS NULL;
  `)

  for (const role of ADMIN_ROLES) {
    await ensureRole(role)
  }
}

export async function touchOryCMSAdminLastLogin(userId: string) {
  await orycmsPrisma.$executeRaw`UPDATE orycms_users SET "lastLoginAt" = now(), "updatedAt" = now() WHERE id = ${userId}::uuid`
}

export async function listOryCMSAdminUsers() {
  await ensureOryCMSAdminUserSchema()
  const rows = await orycmsPrisma.$queryRawUnsafe<AdminUserRow[]>(`
    SELECT ${USER_SELECT}
    FROM orycms_users u
    LEFT JOIN orycms_roles r ON r.id = u."roleId"
    WHERE u."deletedAt" IS NULL
    ORDER BY u."createdAt" DESC
  `)
  return rows.map(toDTO)
}

export async function getOryCMSAdminUser(id: string) {
  await ensureOryCMSAdminUserSchema()
  const [row] = await orycmsPrisma.$queryRawUnsafe<AdminUserRow[]>(`
    SELECT ${USER_SELECT}
    FROM orycms_users u
    LEFT JOIN orycms_roles r ON r.id = u."roleId"
    WHERE u.id = $1::uuid AND u."deletedAt" IS NULL
    LIMIT 1
  `, id)
  return row ? toDTO(row) : null
}

export async function getOryCMSAdminProfile(actor: CurrentOryCMSAdmin) {
  return getOryCMSAdminUser(actor.id)
}

export async function updateOryCMSAdminProfile(actor: CurrentOryCMSAdmin, input: Pick<UserInput, "fullName" | "mobileNumber" | "profilePhoto" | "username">) {
  await ensureOryCMSAdminUserSchema()
  const current = await requireUser(actor.id)
  const fullName = clean(input.fullName)
  const mobileNumber = clean(input.mobileNumber)
  const profilePhoto = clean(input.profilePhoto)
  const username = clean(input.username)

  if (!fullName) throw new Error("Full name is required.")
  validateUsername(username)
  if (username && username !== current.username) await ensureUniqueUsername(username, actor.id)

  await orycmsPrisma.$executeRaw`
    UPDATE orycms_users
    SET "fullName" = ${fullName},
        "mobileNumber" = ${mobileNumber},
        "profilePhoto" = ${profilePhoto},
        username = ${username},
        "updatedAt" = now()
    WHERE id = ${actor.id}::uuid AND "deletedAt" IS NULL
  `
  return requireUser(actor.id)
}

export async function changeOryCMSAdminPassword(actor: CurrentOryCMSAdmin, input: Pick<UserInput, "password" | "confirmPassword"> & { currentPassword?: string }) {
  await ensureOryCMSAdminUserSchema()
  if (!input.currentPassword) throw new Error("Current password is required.")
  if (!input.password || input.password.length < 8) throw new Error("New password must be at least 8 characters.")
  if (input.password !== input.confirmPassword) throw new Error("Passwords do not match.")

  const [row] = await orycmsPrisma.$queryRaw<{ passwordHash: string }[]>`
    SELECT "passwordHash" FROM orycms_users WHERE id = ${actor.id}::uuid AND "deletedAt" IS NULL LIMIT 1
  `
  if (!row || !(await bcrypt.compare(input.currentPassword, row.passwordHash))) {
    throw new Error("Current password is incorrect.")
  }

  await orycmsPrisma.$executeRaw`
    UPDATE orycms_users SET "passwordHash" = ${await bcrypt.hash(input.password, 12)}, "updatedAt" = now()
    WHERE id = ${actor.id}::uuid AND "deletedAt" IS NULL
  `
}

export async function createOryCMSAdminUser(input: UserInput, actor: CurrentOryCMSAdmin) {
  await assertSuperAdmin(actor)
  const data = validateInput(input, true)
  const roleId = await ensureRole(data.role)
  const passwordHash = await bcrypt.hash(data.password, 12)

  await ensureUniqueEmail(data.email)
  if (data.username) await ensureUniqueUsername(data.username)
  const [row] = await orycmsPrisma.$queryRaw<AdminUserRow[]>`
    INSERT INTO orycms_users (id, email, "passwordHash", status, "roleId", "fullName", "mobileNumber", "profilePhoto", username, "emailVerified", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), ${data.email}, ${passwordHash}, ${data.status}, ${roleId}::uuid, ${data.fullName}, ${data.mobileNumber}, ${data.profilePhoto}, ${data.username}, ${data.emailVerified}, now(), now())
    RETURNING id, email, status, "createdAt", "updatedAt", "deletedAt", "fullName", "mobileNumber", "profilePhoto", username, "emailVerified", "lastLoginAt", ${data.role} AS "roleName"
  `
  return toDTO(row)
}

export async function updateOryCMSAdminUser(id: string, input: UserInput, actor: CurrentOryCMSAdmin) {
  await assertSuperAdmin(actor)
  const current = await requireUser(id)
  assertCanModify(actor, current)

  const role = input.role ? normalizeRole(input.role) : current.role
  if (!role) throw new Error("Role is required.")
  if (role !== current.role) assertCanChangeRole(actor)
  const roleId = await ensureRole(role)
  const email = input.email?.trim().toLowerCase() || current.email
  if (email !== current.email) await ensureUniqueEmail(email)
  const username = clean(input.username) ?? current.username
  validateUsername(username)
  if (username && username !== current.username) await ensureUniqueUsername(username, id)

  const [row] = await orycmsPrisma.$queryRaw<AdminUserRow[]>`
    UPDATE orycms_users
    SET email = ${email},
        status = ${normalizeStatus(input.status) ?? current.status},
        "roleId" = ${roleId}::uuid,
        "fullName" = ${clean(input.fullName) ?? current.fullName},
        "mobileNumber" = ${clean(input.mobileNumber) ?? current.mobileNumber},
        "profilePhoto" = ${clean(input.profilePhoto) ?? current.profilePhoto},
        username = ${username},
        "emailVerified" = ${typeof input.emailVerified === "boolean" ? input.emailVerified : current.emailVerified},
        "updatedAt" = now()
    WHERE id = ${id}::uuid AND "deletedAt" IS NULL
    RETURNING id, email, status, "createdAt", "updatedAt", "deletedAt", "fullName", "mobileNumber", "profilePhoto", username, "emailVerified", "lastLoginAt", ${role} AS "roleName"
  `
  if (row.status !== "active") await revokeAdminSessions(id)
  return toDTO(row)
}

export async function resetOryCMSAdminPassword(id: string, input: Pick<UserInput, "password" | "confirmPassword">, actor: CurrentOryCMSAdmin) {
  await assertSuperAdmin(actor)
  const current = await requireUser(id)
  assertCanModify(actor, current)
  if (!input.password || input.password.length < 8) throw new Error("Password must be at least 8 characters.")
  if (input.password !== input.confirmPassword) throw new Error("Passwords do not match.")

  await orycmsPrisma.$executeRaw`
    UPDATE orycms_users SET "passwordHash" = ${await bcrypt.hash(input.password, 12)}, "updatedAt" = now()
    WHERE id = ${id}::uuid AND "deletedAt" IS NULL
  `
  await revokeAdminSessions(id)
}

export async function updateOryCMSAdminUsers(ids: string[], action: "activate" | "deactivate" | "delete", actor: CurrentOryCMSAdmin) {
  await assertSuperAdmin(actor)
  for (const id of ids.filter(Boolean)) {
    if (action === "delete") await deleteOryCMSAdminUser(id, actor)
    else await setOryCMSAdminStatus(id, action === "activate" ? "active" : "inactive", actor)
  }
}

export async function setOryCMSAdminStatus(id: string, status: OryCMSAdminStatus, actor: CurrentOryCMSAdmin) {
  await assertSuperAdmin(actor)
  const current = await requireUser(id)
  assertCanModify(actor, current)
  await orycmsPrisma.$executeRaw`UPDATE orycms_users SET status = ${status}, "updatedAt" = now() WHERE id = ${id}::uuid AND "deletedAt" IS NULL`
  if (status !== "active") await revokeAdminSessions(id)
}

export async function deleteOryCMSAdminUser(id: string, actor: CurrentOryCMSAdmin) {
  await assertSuperAdmin(actor)
  if (id === actor.id) throw new Error("You cannot delete your own account.")
  const current = await requireUser(id)
  assertCanModify(actor, current)
  await orycmsPrisma.$executeRaw`UPDATE orycms_users SET "deletedAt" = now(), status = 'inactive', "updatedAt" = now() WHERE id = ${id}::uuid`
  await revokeAdminSessions(id)
}

async function requireUser(id: string) {
  const user = await getOryCMSAdminUser(id)
  if (!user) throw new Error("User not found.")
  return user
}

async function assertSuperAdmin(actor: CurrentOryCMSAdmin) {
  await ensureOryCMSAdminUserSchema()
  if (!isSuperAdmin(actor.roleName)) throw new Error("Only Super Admins can manage admin users.")
}

function assertCanChangeRole(actor: CurrentOryCMSAdmin) {
  if (!isSuperAdmin(actor.roleName)) throw new Error("Only Super Admins can change admin roles.")
}

function assertCanModify(actor: CurrentOryCMSAdmin, target: OryCMSAdminUserDTO) {
  if (isSuperAdmin(target.role) && !isSuperAdmin(actor.roleName)) throw new Error("Only Super Admins can modify Super Admin accounts.")
}

async function ensureRole(role: OryCMSAdminRole) {
  const [row] = await orycmsPrisma.$queryRaw<{ id: string }[]>`
    INSERT INTO orycms_roles (id, name)
    VALUES (gen_random_uuid(), ${role})
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  `
  return row.id
}

async function ensureUniqueEmail(email: string) {
  const [existing] = await orycmsPrisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM orycms_users WHERE lower(email) = lower(${email}) AND "deletedAt" IS NULL LIMIT 1
  `
  if (existing) throw new Error("An admin user already exists with this email.")
}

async function ensureUniqueUsername(username: string, ignoreId?: string) {
  const [existing] = await orycmsPrisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM orycms_users
    WHERE lower(username) = lower(${username})
      AND "deletedAt" IS NULL
      AND (${ignoreId ?? null}::uuid IS NULL OR id <> ${ignoreId ?? null}::uuid)
    LIMIT 1
  `
  if (existing) throw new Error("An admin user already exists with this username.")
}

async function revokeAdminSessions(id: string) {
  await orycmsPrisma.$executeRaw`DELETE FROM orycms_sessions WHERE "userId" = ${id}::uuid`
}

function validateInput(input: UserInput, creating: boolean) {
  const fullName = clean(input.fullName)
  const email = input.email?.trim().toLowerCase()
  const role = normalizeRole(input.role)
  const status = normalizeStatus(input.status) ?? "active"

  if (!fullName) throw new Error("Full name is required.")
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new Error("Valid email is required.")
  if (!role) throw new Error("Role is required.")
  if (creating && (!input.password || input.password.length < 8)) throw new Error("Password must be at least 8 characters.")
  if (creating && input.password !== input.confirmPassword) throw new Error("Passwords do not match.")
  validateUsername(clean(input.username))

  return {
    email,
    emailVerified: Boolean(input.emailVerified),
    fullName,
    mobileNumber: clean(input.mobileNumber),
    password: input.password ?? "",
    profilePhoto: clean(input.profilePhoto),
    role,
    status,
    username: clean(input.username),
  }
}

function validateUsername(username: string | null) {
  if (username && !/^[a-zA-Z0-9._-]{3,32}$/.test(username)) {
    throw new Error("Username must be 3-32 characters and use only letters, numbers, dot, underscore, or hyphen.")
  }
}

function toDTO(row: AdminUserRow): OryCMSAdminUserDTO {
  return {
    createdAt: iso(row.createdAt) ?? new Date().toISOString(),
    deletedAt: iso(row.deletedAt),
    email: row.email,
    emailVerified: Boolean(row.emailVerified),
    fullName: row.fullName || row.email,
    id: row.id,
    lastLoginAt: iso(row.lastLoginAt),
    mobileNumber: row.mobileNumber ?? "",
    profilePhoto: row.profilePhoto,
    role: normalizeRole(row.roleName) ?? "Admin",
    status: normalizeStatus(row.status) ?? "inactive",
    updatedAt: iso(row.updatedAt) ?? new Date().toISOString(),
    username: row.username ?? "",
  }
}

function normalizeRole(value: unknown): OryCMSAdminRole | null {
  if (value === "Owner") return "Owner"
  return ADMIN_ROLES.includes(value as OryCMSAdminRole) ? value as OryCMSAdminRole : null
}

function normalizeStatus(value: unknown): OryCMSAdminStatus | null {
  return value === "active" || value === "inactive" ? value : null
}

function isSuperAdmin(role: string) {
  return role === "Owner" || role === "Super Admin"
}

function clean(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function iso(value: unknown) {
  if (!value) return null
  return value instanceof Date ? value.toISOString() : String(value)
}
