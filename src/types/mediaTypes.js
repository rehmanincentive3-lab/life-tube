/**
 * Life Tube - Media Analysis Data Types & Error Categories
 */

export const MEDIA_MODES = {
  VIDEO: 'VIDEO',
  AUDIO: 'AUDIO',
};

export const UI_STATES = {
  EMPTY: 'EMPTY',
  LOADING: 'LOADING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
};

export const ERROR_TYPES = {
  EMPTY_URL: 'EMPTY_URL',
  INVALID_URL: 'INVALID_URL',
  UNSUPPORTED_URL: 'UNSUPPORTED_URL',
  VIDEO_UNAVAILABLE: 'VIDEO_UNAVAILABLE',
  PRIVATE_VIDEO: 'PRIVATE_VIDEO',
  REGION_RESTRICTED: 'REGION_RESTRICTED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  EXTRACTION_FAILURE: 'EXTRACTION_FAILURE',
  UNKNOWN: 'UNKNOWN',
};

export const ERROR_MESSAGES = {
  [ERROR_TYPES.EMPTY_URL]: 'Please paste a video URL.',
  [ERROR_TYPES.INVALID_URL]: 'Please enter a valid video URL.',
  [ERROR_TYPES.UNSUPPORTED_URL]: 'This URL is not supported.',
  [ERROR_TYPES.VIDEO_UNAVAILABLE]: 'This video is unavailable or has been deleted.',
  [ERROR_TYPES.PRIVATE_VIDEO]: 'This video is private and cannot be accessed.',
  [ERROR_TYPES.REGION_RESTRICTED]: 'This video is restricted in your region.',
  [ERROR_TYPES.NETWORK_ERROR]: 'Unable to analyze this video right now. Please check your connection and try again.',
  [ERROR_TYPES.TIMEOUT]: 'The analysis request timed out. Please try again.',
  [ERROR_TYPES.EXTRACTION_FAILURE]: 'Unable to extract stream metadata from this provider. Please try another link.',
  [ERROR_TYPES.UNKNOWN]: 'Unable to analyze this video right now. Please try again.',
};
