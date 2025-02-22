// Simple logger function for errors
export const logError = (message: string, details: any) => {
    console.error(`[ERROR] ${message}:`, details)
    // In a production environment, you might want to send this to a logging service
    // For example: sendToLoggingService(message, details);
  }
  
  