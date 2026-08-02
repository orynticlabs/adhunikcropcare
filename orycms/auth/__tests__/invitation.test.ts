import { describe, it, expect, vi } from "vitest"

vi.mock("server-only", () => ({}))

if (!process.env.DATABASE_URL && !process.env.ORYCMS_DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/adhunikcropcare"
}

import { checkResendCooldown, validateInvitationToken } from "../../../src/lib/orycms/invitation"

describe("checkResendCooldown", () => {
  it("allows sending invitation when lastInvitedAt is null", () => {
    const result = checkResendCooldown(null)
    expect(result.allowed).toBe(true)
    expect(result.remainingMs).toBe(0)
  })

  it("blocks sending invitation when lastInvitedAt is within 12 hours", () => {
    const recentDate = new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
    const result = checkResendCooldown(recentDate)
    expect(result.allowed).toBe(false)
    expect(result.remainingMs).toBeGreaterThan(0)
  })

  it("allows sending invitation when lastInvitedAt is older than 12 hours", () => {
    const oldDate = new Date(Date.now() - 13 * 60 * 60 * 1000) // 13 hours ago
    const result = checkResendCooldown(oldDate)
    expect(result.allowed).toBe(true)
    expect(result.remainingMs).toBe(0)
  })
})

describe("validateInvitationToken", () => {
  it("rejects empty or non-string token", async () => {
    const res = await validateInvitationToken("")
    expect(res.valid).toBe(false)
    expect(res.reason).toBe("INVALID_TOKEN")
  })
})
