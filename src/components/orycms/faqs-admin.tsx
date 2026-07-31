"use client"

import { useEffect, useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  Edit2,
  HelpCircle,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  Clock,
  Layers,
  Save,
} from "lucide-react"
import { OryCMSBreadcrumbs } from "@/components/orycms/breadcrumbs"
import { OryCMSSelect } from "@/components/orycms/custom-select"
import type { OryCMSFaqDTO } from "@/lib/orycms/faqs"

export function OryCMSFaqsAdmin() {
  const [faqs, setFaqs] = useState<OryCMSFaqDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFaq, setEditingFaq] = useState<OryCMSFaqDTO | null>(null)
  const [formQuestion, setFormQuestion] = useState("")
  const [formAnswer, setFormAnswer] = useState("")
  const [formOrder, setFormOrder] = useState<number>(0)
  const [formStatus, setFormStatus] = useState<"published" | "draft">("published")
  const [formCategory, setFormCategory] = useState("General")
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState("")

  useEffect(() => {
    loadFaqs()
  }, [])

  async function loadFaqs() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/orycms/faqs")
      const json = await res.json()
      if (res.ok && json.success) {
        setFaqs(json.data || [])
      } else {
        setError(json.error?.message || "Failed to load FAQs")
      }
    } catch {
      setError("Error connecting to server")
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setEditingFaq(null)
    setFormQuestion("")
    setFormAnswer("")
    // Default order is max order + 1 or 0
    const maxOrder = faqs.length > 0 ? Math.max(...faqs.map((f) => f.displayOrder || 0)) : 0
    setFormOrder(maxOrder + 1)
    setFormStatus("published")
    setFormCategory("General")
    setFormError("")
    setIsModalOpen(true)
  }

  function openEditModal(faq: OryCMSFaqDTO) {
    setEditingFaq(faq)
    setFormQuestion(faq.question)
    setFormAnswer(faq.answer)
    setFormOrder(faq.displayOrder || 0)
    setFormStatus(faq.status)
    setFormCategory(faq.category || "General")
    setFormError("")
    setIsModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formQuestion.trim()) {
      setFormError("Question is required")
      return
    }
    if (!formAnswer.trim()) {
      setFormError("Answer is required")
      return
    }

    setSubmitting(true)
    setFormError("")

    try {
      const url = editingFaq ? `/api/orycms/faqs/${editingFaq.id}` : "/api/orycms/faqs"
      const method = editingFaq ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: formQuestion,
          answer: formAnswer,
          displayOrder: Number(formOrder) || 0,
          status: formStatus,
          category: formCategory,
        }),
      })

      const json = await res.json()
      if (res.ok && json.success) {
        setIsModalOpen(false)
        await loadFaqs()
      } else {
        setFormError(json.error?.message || "Save failed")
      }
    } catch {
      setFormError("Error submitting form")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this FAQ?")) return

    try {
      const res = await fetch(`/api/orycms/faqs/${id}`, { method: "DELETE" })
      if (res.ok) {
        setFaqs((current) => current.filter((f) => f.id !== id))
      } else {
        alert("Failed to delete FAQ")
      }
    } catch {
      alert("Error deleting FAQ")
    }
  }

  async function handleMoveOrder(index: number, direction: "up" | "down") {
    if (direction === "up" && index === 0) return
    if (direction === "down" && index === faqs.length - 1) return

    const targetIndex = direction === "up" ? index - 1 : index + 1
    const currentItem = faqs[index]
    const targetItem = faqs[targetIndex]

    // Swap displayOrder values
    const currentOrder = currentItem.displayOrder || (index + 1)
    const targetOrder = targetItem.displayOrder || (targetIndex + 1)

    // Optimistic update
    const updated = [...faqs]
    updated[index] = { ...currentItem, displayOrder: targetOrder }
    updated[targetIndex] = { ...targetItem, displayOrder: currentOrder }
    updated.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    setFaqs(updated)

    // Save to server
    try {
      await Promise.all([
        fetch(`/api/orycms/faqs/${currentItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...currentItem, displayOrder: targetOrder }),
        }),
        fetch(`/api/orycms/faqs/${targetItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...targetItem, displayOrder: currentOrder }),
        }),
      ])
      await loadFaqs()
    } catch {
      await loadFaqs()
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--orycms-color-primary)]/10 text-[var(--orycms-color-primary)]">
              <HelpCircle className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              FAQ Management
            </h1>
          </div>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Create, order, and publish frequently asked questions for the storefront.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-foreground px-4 text-xs font-semibold text-background transition-opacity hover:opacity-90 active:scale-98 sm:text-sm"
        >
          <Plus className="h-4 w-4" /> Add New Question
        </button>
      </div>

      {/* ── Error Banner ──────────────────────────────────────── */}
      {error && (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive sm:text-sm">
          {error}
        </div>
      )}

      {/* ── FAQ List ──────────────────────────────────────────── */}
      <div className="mt-6">
        {loading && faqs.length === 0 ? (
          <div className="grid min-h-[200px] place-items-center rounded-2xl border border-border bg-surface text-xs text-muted-foreground sm:text-sm">
            Loading FAQs…
          </div>
        ) : faqs.length === 0 ? (
          <div className="grid min-h-[220px] place-items-center rounded-2xl border border-dashed border-border bg-surface-muted/30 p-8 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
              <HelpCircle className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-foreground sm:text-base">
              No FAQs created yet
            </h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground sm:text-sm">
              Add your first question to display on storefront pages. Order can be specified for each item.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-4 text-xs font-medium text-background hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Add Question
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={faq.id}
                className="group relative rounded-2xl border border-border/80 bg-surface p-4 shadow-xs transition-all hover:border-border hover:shadow-md sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {/* Question & Answer */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Order Badge */}
                      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] font-semibold text-foreground">
                        <Layers className="h-3 w-3 text-muted-foreground" /> Order: {faq.displayOrder}
                      </span>

                      {/* Status Pill */}
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                          faq.status === "published"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {faq.status === "published" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {faq.status === "published" ? "Published" : "Draft"}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold leading-snug text-foreground sm:text-base">
                      {faq.question}
                    </h3>
                    <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                      {faq.answer}
                    </p>
                  </div>

                  {/* Actions (Mobile Responsive Toolbar) */}
                  <div className="flex items-center gap-1 shrink-0 self-end pt-2 border-t border-border/40 sm:self-start sm:border-0 sm:pt-0">
                    {/* Move Up */}
                    <button
                      type="button"
                      onClick={() => handleMoveOrder(index, "up")}
                      disabled={index === 0}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
                      title="Move Up"
                      aria-label="Move Up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>

                    {/* Move Down */}
                    <button
                      type="button"
                      onClick={() => handleMoveOrder(index, "down")}
                      disabled={index === faqs.length - 1}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
                      title="Move Down"
                      aria-label="Move Down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => openEditModal(faq)}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                      title="Edit FAQ"
                      aria-label="Edit FAQ"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDelete(faq.id)}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-destructive/20 bg-destructive/5 text-destructive transition-colors hover:bg-destructive/15"
                      title="Delete FAQ"
                      aria-label="Delete FAQ"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ───────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-background/80 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-surface p-6 shadow-pop sm:p-8">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                {editingFaq ? "Edit FAQ Item" : "Add New FAQ Item"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Question */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Question *
                </label>
                <input
                  type="text"
                  value={formQuestion}
                  onChange={(e) => setFormQuestion(e.target.value)}
                  placeholder="e.g. Are your products organic certified?"
                  className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-xs text-foreground outline-none focus:border-foreground sm:text-sm"
                  required
                />
              </div>

              {/* Answer */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Answer *
                </label>
                <textarea
                  rows={4}
                  value={formAnswer}
                  onChange={(e) => setFormAnswer(e.target.value)}
                  placeholder="Enter detailed answer here..."
                  className="w-full rounded-xl border border-border bg-background p-3.5 text-xs text-foreground outline-none focus:border-foreground sm:text-sm"
                  required
                />
              </div>

              {/* Order & Status Grid (Mobile Responsive) */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Display Order (Number)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formOrder}
                    onChange={(e) => setFormOrder(Number(e.target.value))}
                    className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-xs text-foreground outline-none focus:border-foreground sm:text-sm"
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Lower numbers display first (1, 2, 3...)
                  </p>
                </div>

                <div>
                  <OryCMSSelect
                    label="Status"
                    value={formStatus}
                    onChange={(val) => setFormStatus(val as "published" | "draft")}
                    options={[
                      { label: "Published", value: "published" },
                      { label: "Draft", value: "draft" },
                    ]}
                  />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 rounded-xl border border-border px-5 text-xs font-semibold text-foreground hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-foreground px-6 text-xs font-semibold text-background hover:opacity-90 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {submitting ? "Saving…" : "Save Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
