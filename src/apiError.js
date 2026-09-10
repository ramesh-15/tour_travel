function formatLocationPart(part) {
  if (typeof part === "number") return `item ${part + 1}`;
  return String(part)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

/**
 * Turns FastAPI/Pydantic validation responses into readable form feedback.
 * For example, `[{ loc: ["body", "email"], msg: "Field required" }]`
 * becomes `Email: Field required.` rather than `[object Object]`.
 */
export function formatApiError(
  detail,
  fallback = "Unable to complete this request.",
) {
  if (typeof detail === "string" && detail.trim()) return detail.trim();

  if (Array.isArray(detail)) {
    const messages = detail
      .map((issue) => {
        if (typeof issue === "string") return issue.trim();
        if (!issue || typeof issue !== "object") return "";

        const location = Array.isArray(issue.loc)
          ? issue.loc
              .filter((part) => !["body", "query", "path"].includes(part))
              .map(formatLocationPart)
              .join(" > ")
          : "";
        const message = issue.msg || issue.message || issue.error;
        if (typeof message !== "string" || !message.trim()) return location;
        return location ? `${location}: ${message}` : message;
      })
      .filter(Boolean);

    if (messages.length) return messages.slice(0, 3).join(". ");
  }

  if (detail && typeof detail === "object") {
    const nestedDetail = detail.detail || detail.message || detail.msg || detail.error;
    if (nestedDetail && nestedDetail !== detail) {
      return formatApiError(nestedDetail, fallback);
    }
  }

  return fallback;
}
