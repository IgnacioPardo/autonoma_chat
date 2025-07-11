/**
 * Utility functions for clipboard and sharing operations
 */

/**
 * Copies text to clipboard with error handling
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error("Error copying text: ", err);
  }
}

/**
 * Shares text using Web Share API with clipboard fallback
 */
export async function shareText(text: string): Promise<void> {
  if (navigator.share) {
    try {
      await navigator.share({
        title: "Mensaje de Autonoma Chat",
        text: text,
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      console.error("Error sharing: ", err);
      // Fallback: copy to clipboard
      await copyToClipboard(text);
    }
  } else {
    // Fallback: copy to clipboard
    await copyToClipboard(text);
  }
}
