import bcrypt from "bcryptjs"
import { orycmsPrisma } from "@/lib/orycms/prisma"
import { ensureOryCMSAdminUserSchema } from "@/lib/orycms/users"

type SetupInput = {
  confirmPassword?: string
  email?: string
  fullName?: string
  password?: string
}

type InitialAdminRow = {
  email: string
  fullName: string | null
  id: string
  roleName: string
}

const SETUP_LOCK_ID = 73014091

export async function isOryCMSSetupComplete() {
  await ensureOryCMSAdminUserSchema()
  const [row] = await orycmsPrisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count
    FROM orycms_users
  `
  return Number(row?.count ?? 0) > 0
}

export async function createInitialOryCMSSuperAdmin(input: SetupInput) {
  await ensureOryCMSAdminUserSchema()
  const data = validateSetupInput(input)
  const passwordHash = await bcrypt.hash(data.password, 12)

  return orycmsPrisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${SETUP_LOCK_ID})`

    const [adminCount] = await tx.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM orycms_users
    `
    if (Number(adminCount?.count ?? 0) > 0) {
      throw new Error("OryCMS setup is already completed.")
    }

    const [existingEmail] = await tx.$queryRaw<{ id: string }[]>`
      SELECT id
      FROM orycms_users
      WHERE lower(email) = lower(${data.email})
      LIMIT 1
    `
    if (existingEmail) throw new Error("An admin user already exists with this email.")

    const [role] = await tx.$queryRaw<{ id: string }[]>`
      INSERT INTO orycms_roles (id, name)
      VALUES (gen_random_uuid(), 'Super Admin')
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `

    const [user] = await tx.$queryRaw<InitialAdminRow[]>`
      INSERT INTO orycms_users (
        id,
        email,
        "passwordHash",
        status,
        "roleId",
        "fullName",
        "emailVerified",
        "lastLoginAt",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        gen_random_uuid(),
        ${data.email},
        ${passwordHash},
        'active',
        ${role.id}::uuid,
        ${data.fullName},
        true,
        now(),
        now(),
        now()
      )
      RETURNING id, email, "fullName", 'Super Admin' AS "roleName"
    `

    return user
  })
}

function validateSetupInput(input: SetupInput) {
  const fullName = input.fullName?.trim()
  const email = input.email?.trim().toLowerCase()
  const password = input.password ?? ""

  if (!fullName) throw new Error("Full name is required.")
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) throw new Error("Valid email is required.")
  if (password !== input.confirmPassword) throw new Error("Passwords do not match.")
  if (!isStrongPassword(password)) {
    throw new Error("Password must be at least 8 characters and include uppercase, lowercase, number, and special character.")
  }

  return { email, fullName, password }
}

function isStrongPassword(password: string) {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  )
}
