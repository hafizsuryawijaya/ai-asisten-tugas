export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined" || !text) return false;

  try {
    // 1. Try modern Navigator Clipboard API if available and in secure context
    if (
      typeof window.isSecureContext !== "undefined" &&
      window.isSecureContext &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
    ) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // 2. Legacy / HTTP / LAN IP fallback using temporary textarea
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    textArea.style.opacity = "0";
    textArea.setAttribute("readonly", "");

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error("[Clipboard Error] Failed to copy text:", err);
    return false;
  }
}
