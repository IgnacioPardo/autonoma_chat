/**
 * Utility functions for clipboard and sharing operations
 */

import { toastUtils } from './toast-utils';

/**
 * Copies text to clipboard with error handling
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    toastUtils.success('Copiado al portapapeles');
  } catch (err) {
    console.error("Error copying text: ", err);
    toastUtils.error('Error al copiar al portapapeles');
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
      toastUtils.success('Compartido correctamente');
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return; // User cancelled sharing
      }
      console.error("Error sharing: ", err);
      toastUtils.error('Error al compartir, copiando al portapapeles...');
      // Fallback: copy to clipboard
      await copyToClipboard(text);
    }
  } else {
    // Fallback: copy to clipboard when share API not available
    await copyToClipboard(text);
  }
}
