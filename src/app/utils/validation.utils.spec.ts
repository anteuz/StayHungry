import { ValidationUtils } from './validation.utils';

describe('ValidationUtils Security Tests', () => {
  describe('Email Validation Security', () => {
    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test..test@example.com',
        'test@example',
        '',
        null,
        undefined,
        'a'.repeat(255) + '@example.com' // Test length limit
      ];

      invalidEmails.forEach(email => {
        expect(ValidationUtils.validateEmail(email)).toBe(false);
      });
    });

    it('should accept valid email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'test123@sub.example.com'
      ];

      validEmails.forEach(email => {
        expect(ValidationUtils.validateEmail(email)).toBe(true);
      });
    });

    it('should enforce email length limits to prevent buffer overflow', () => {
      const tooLongEmail = 'a'.repeat(250) + '@' + 'b'.repeat(250) + '.com';
      expect(ValidationUtils.validateEmail(tooLongEmail)).toBe(false);
    });

    it('should handle malicious email patterns', () => {
      const maliciousEmails = [
        "admin'--@example.com",
        "test@example.com'; DROP TABLE users; --",
        "test@example.com<script>alert('xss')</script>",
        "test@example.com\x00admin@domain.com"
      ];

      maliciousEmails.forEach(email => {
        expect(ValidationUtils.validateEmail(email)).toBe(false);
      });
    });
  });

  describe('Password Validation Security', () => {
    it('should reject weak passwords', () => {
      const weakPasswords = [
        'short',
        '12345678', // Only numbers
        'password', // Only letters
        'PASSWORD', // Only uppercase
        '',
        null,
        undefined,
        'a'.repeat(129) // Test length limit
      ];

      weakPasswords.forEach(password => {
        expect(ValidationUtils.validatePassword(password)).toBe(false);
      });
    });

    it('should accept strong passwords', () => {
      const strongPasswords = [
        'Password123',
        'MyStr0ngP@ss',
        'SecurePass1',
        'Valid123@',
        'Test$1234'
      ];

      strongPasswords.forEach(password => {
        expect(ValidationUtils.validatePassword(password)).toBe(true);
      });
    });

    it('should enforce password length limits', () => {
      const tooLongPassword = 'A1' + 'a'.repeat(130);
      expect(ValidationUtils.validatePassword(tooLongPassword)).toBe(false);
    });
  });

  describe('Email Sanitization Security', () => {
    it('should sanitize email input correctly', () => {
      const testCases = [
        { input: '  Test@EXAMPLE.COM  ', expected: 'test@example.com' },
        { input: 'User@Domain.Com', expected: 'user@domain.com' },
        { input: '\tspaced@email.com\n', expected: 'spaced@email.com' }
      ];

      testCases.forEach(testCase => {
        expect(ValidationUtils.sanitizeEmail(testCase.input)).toBe(testCase.expected);
      });
    });

    it('should throw error for invalid email input', () => {
      const invalidInputs = [null, undefined, '', 123, {}];

      invalidInputs.forEach(input => {
        expect(() => ValidationUtils.sanitizeEmail(input as any)).toThrow('Email is required');
      });
    });
  });

  describe('General Input Validation', () => {
    it('should validate input lengths', () => {
      expect(ValidationUtils.validateInput('short', 10)).toBe(true);
      expect(ValidationUtils.validateInput('toolongstring', 5)).toBe(false);
      expect(ValidationUtils.validateInput('', 10)).toBe(false);
      expect(ValidationUtils.validateInput(null, 10)).toBe(false);
    });

    it('should use default max length when not specified', () => {
      const longInput = 'a'.repeat(1001);
      expect(ValidationUtils.validateInput(longInput)).toBe(false);
      
      const validInput = 'a'.repeat(999);
      expect(ValidationUtils.validateInput(validInput)).toBe(true);
    });
  });
});