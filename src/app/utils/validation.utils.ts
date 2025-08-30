/**
 * Utility functions for input validation and security
 */

export class ValidationUtils {
  
  static validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string' || email.trim() === '') {
      return false;
    }
    
    // More strict email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const trimmedEmail = email.trim();
    
    // Additional security checks
    if (trimmedEmail.length > 254) return false; // RFC 5321 limit
    if (trimmedEmail.includes('..')) return false; // No consecutive dots
    if (trimmedEmail.startsWith('.') || trimmedEmail.endsWith('.')) return false; // No leading/trailing dots
    if (trimmedEmail.includes('<') || trimmedEmail.includes('>')) return false; // No HTML tags
    if (trimmedEmail.includes('script') || trimmedEmail.includes('javascript')) return false; // No script content
    if (trimmedEmail.includes('\x00') || trimmedEmail.includes('\n') || trimmedEmail.includes('\r')) return false; // No null bytes or newlines
    
    return emailRegex.test(trimmedEmail);
  }

  static validatePassword(password: string): boolean {
    if (!password || typeof password !== 'string') {
      return false;
    }
    
    // Minimum 8 characters, at least one letter and one number
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password) && password.length <= 128; // Reasonable max length
  }

  static sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') {
      throw new Error('Email is required');
    }
    
    return email.trim().toLowerCase();
  }

  static validateInput(input: string, maxLength: number = 1000): boolean {
    if (!input || typeof input !== 'string') {
      return false;
    }
    
    return input.length <= maxLength;
  }
}