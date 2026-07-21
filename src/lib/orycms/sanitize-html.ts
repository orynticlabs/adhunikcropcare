import sanitizeHtml from "sanitize-html"

/**
 * Sanitizes admin-authored rich text before storage. The storefront renders these
 * fields via dangerouslySetInnerHTML, so we constrain the HTML to a safe formatting
 * subset (headings, lists, tables, links, images, alignment) and drop scripts,
 * event handlers, and unknown attributes.
 */
export function sanitizeRichText(html: string | null | undefined): string {
  if (!html) return ""
  const cleaned = sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "hr",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "strong", "b", "em", "i", "u", "s", "strike", "sub", "sup",
      "ul", "ol", "li",
      "blockquote", "pre", "code",
      "a", "img",
      "table", "thead", "tbody", "tr", "th", "td",
      "span", "div",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
      "*": ["style"],
      th: ["colspan", "rowspan", "colwidth"],
      td: ["colspan", "rowspan", "colwidth"],
    },
    // Only allow the text-align styles the editor produces (plus basic width for tables).
    allowedStyles: {
      "*": {
        "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/],
      },
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["http", "https", "data"] },
    transformTags: {
      // Force links to open safely in a new tab.
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer nofollow", target: "_blank" }),
    },
  })
  // Collapse a doc that sanitized down to nothing meaningful.
  return cleaned.trim() === "<p></p>" ? "" : cleaned.trim()
}
