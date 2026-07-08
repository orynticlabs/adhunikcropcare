"use client"

import { useActionState } from "react"
import type { CmsCollectionDefinition } from "@/lib/cms/collections"
import type { CmsActionState } from "@/lib/cms/forms"
import { initialCmsActionState } from "@/lib/cms/forms"

type CmsFormProps = {
  action: (state: CmsActionState, formData: FormData) => Promise<CmsActionState>
  definition: CmsCollectionDefinition
  initialValues?: Record<string, string | number | boolean>
  submitLabel: string
  hiddenValues?: Record<string, string>
}

export function CmsForm({
  action,
  definition,
  initialValues = {},
  submitLabel,
  hiddenValues = {},
}: CmsFormProps) {
  const [state, formAction, pending] = useActionState(action, initialCmsActionState)

  return (
    <form action={formAction} className="space-y-5">
      {Object.entries(hiddenValues).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      {definition.fields.map((field) => {
        const value = initialValues[field.name]
        const commonLabel = (
          <div className="mb-1 flex items-center justify-between gap-3">
            <label htmlFor={field.name} className="text-sm font-medium">
              {field.label}
            </label>
            {field.required ? (
              <span className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                Required
              </span>
            ) : null}
          </div>
        )

        return (
          <div key={field.name} className="space-y-1">
            {commonLabel}

            {field.type === "textarea" ? (
              <textarea
                id={field.name}
                name={field.name}
                defaultValue={typeof value === "string" ? value : ""}
                rows={field.rows ?? 4}
                placeholder={field.placeholder}
                className="min-h-28 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-[--leaf]"
              />
            ) : field.type === "select" ? (
              <select
                id={field.name}
                name={field.name}
                defaultValue={typeof value === "string" ? value : ""}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-[--leaf]"
              >
                <option value="">Select {field.label.toLowerCase()}</option>
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : field.type === "toggle" ? (
              <label className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm">
                <input
                  id={field.name}
                  name={field.name}
                  type="checkbox"
                  defaultChecked={Boolean(value)}
                  className="h-4 w-4 rounded border-border text-[--moss] focus:ring-[--leaf]"
                />
                <span>{field.helpText ?? `Enable ${field.label.toLowerCase()}`}</span>
              </label>
            ) : (
              <input
                id={field.name}
                name={field.name}
                type={field.type === "number" ? "number" : "text"}
                required={field.required}
                defaultValue={
                  typeof value === "string" || typeof value === "number" ? value : ""
                }
                placeholder={field.placeholder}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-[--leaf]"
              />
            )}

            {field.helpText ? (
              <p className="text-xs text-muted-foreground">{field.helpText}</p>
            ) : null}
          </div>
        )
      })}

      {state.error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      {state.message ? (
        <div className="rounded-2xl border border-[--leaf]/20 bg-[--leaf]/8 px-4 py-3 text-sm text-[--moss]">
          {state.message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-full bg-[--moss] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[--leaf] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving..." : submitLabel}
      </button>
    </form>
  )
}

