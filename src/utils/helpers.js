/**
 * Life Tube - Utility Functions
 */

export const copyTextToClipboard = async (text) => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  return false;
};

export const readTextFromClipboard = async () => {
  if (navigator.clipboard && navigator.clipboard.readText) {
    const text = await navigator.clipboard.readText();
    return text ? text.trim() : '';
  }
  return '';
};

export const isValidUrl = (string) => {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};
