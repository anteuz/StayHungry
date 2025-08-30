# Comprehensive Testing Guide - StayHungry App

## Overview

This guide documents the comprehensive testing strategy implemented for the StayHungry application, focusing on integration testing, security validation, and maintainable test practices that support refactoring without breaking functionality.

## Test Framework Setup

### Jest Configuration
- **Framework**: Jest with jest-preset-angular
- **Coverage**: 70% minimum threshold for statements, branches, functions, and lines
- **Reports**: HTML, text, and LCOV formats
- **Location**: All test files in `src/app/**/*.spec.ts`

### Key Configuration Features
```json
{
  "preset": "jest-preset-angular",
  "collectCoverage": true,
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "functions": 70,
      "lines": 70,
      "statements": 70
    }
  }
}
```

## Test Structure

### 1. Service Layer Tests

#### AuthService (`src/app/services/auth.service.spec.ts`)
- **Security Focus**: Input validation, authentication state management
- **Coverage**: Email/password validation, state management, error handling
- **Security Tests**: 
  - Injection attack prevention
  - Input sanitization
  - Strong password enforcement
  - Email format validation

#### ShoppingListService (`src/app/services/shopping-list.service.spec.ts`)
- **Integration Focus**: Firebase integration, data management
- **Coverage**: CRUD operations, user data isolation, error handling
- **Security Tests**:
  - User authentication requirements
  - Data access control
  - Input validation

#### CloudStoreService (`src/app/services/cloud-store.service.spec.ts`)
- **Security Focus**: File upload validation, access control
- **Coverage**: File type/size validation, authentication, path security
- **Security Tests**:
  - Malicious file upload prevention
  - File size attack prevention
  - Authentication enforcement

### 2. Component Integration Tests

#### SignInPage (`src/app/sign-in/sign-in.page.spec.ts`)
- **Integration Focus**: Complete authentication workflow
- **Coverage**: Form validation, error handling, UI state management
- **Security Tests**:
  - Error message sanitization
  - Form validation security
  - Loading state management

#### SignUpPage (`src/app/sign-up/sign-up.page.spec.ts`)
- **Integration Focus**: User registration workflow
- **Coverage**: Account creation, validation, error handling
- **Security Tests**:
  - Registration security
  - Error sanitization
  - Input validation integration

#### ShoppingListPage (`src/app/shopping-list/shopping-list.page.spec.ts`)
- **Integration Focus**: Complete shopping list management
- **Coverage**: Service integration, UI interactions, state management
- **Security Tests**:
  - Data validation
  - XSS prevention awareness

### 3. Security Guard Tests

#### AuthGuard (`src/app/shared/auth-guard.service.spec.ts`)
- **Critical Security**: Route protection verification
- **Coverage**: Authentication checks, redirect functionality
- **Security Tests**:
  - Authentication bypass prevention
  - Edge case handling
  - Router integration

### 4. End-to-End Integration Tests

#### Complete Workflow Tests (`src/app/integration/user-workflow.integration.spec.ts`)
- **Comprehensive Integration**: Cross-service functionality
- **Coverage**: Complete user workflows, service interactions
- **Security Tests**:
  - Authentication enforcement across services
  - Data isolation verification
  - Cross-service security validation

### 5. Security Vulnerability Tests

#### Security-Specific Tests (`src/app/security/security-vulnerabilities.spec.ts`)
- **Dedicated Security**: Common vulnerability prevention
- **Coverage**: Injection attacks, XSS, authentication bypass
- **Security Tests**:
  - Input validation security
  - File upload security
  - Authentication security
  - Error information disclosure prevention

## Running Tests

### Basic Test Commands
```bash
# Run all tests with coverage
npm test

# Run specific test file
npm test -- --testPathPattern="auth.service.spec.ts"

# Run tests without coverage for faster execution
npm test -- --no-coverage

# Run tests in watch mode for development
npm test -- --watch

# Run only security tests
npm test -- --testPathPattern="security"
```

### Coverage Commands
```bash
# Generate coverage report
npm test -- --coverage

# View coverage report (after running)
open coverage/index.html
```

## Test Writing Guidelines

### 1. Security-First Testing
- Always test authentication requirements
- Validate input sanitization
- Test error message sanitization
- Verify user data isolation

### 2. Integration Testing Principles
- Test complete workflows, not just units
- Mock external dependencies (Firebase, HTTP)
- Test error boundaries and edge cases
- Verify state management across components

### 3. Refactor-Safe Testing
- Test behavior, not implementation details
- Use descriptive test names
- Focus on public interfaces
- Avoid over-mocking internal methods

### 4. Security Test Categories

#### Authentication Tests
```typescript
it('should reject unauthenticated access', () => {
  expect(() => service.protectedOperation()).toThrow('User must be authenticated');
});
```

#### Input Validation Tests
```typescript
it('should reject malicious email formats', () => {
  const maliciousEmail = "admin'--@example.com";
  expect(() => service.validateEmail(maliciousEmail)).toThrow('Invalid email format');
});
```

#### File Security Tests
```typescript
it('should reject non-image files', async () => {
  const maliciousFile = new File(['script'], 'malicious.js', { type: 'application/javascript' });
  await expect(service.uploadFile(maliciousFile)).rejects.toThrow('Only image files allowed');
});
```

## Test Coverage Requirements

### Minimum Coverage Thresholds
- **Statements**: 70%
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%

### Critical Components (100% Coverage Required)
- Authentication services and guards
- Security validation functions
- File upload/download operations
- User data access methods

### Integration Test Coverage
- ✅ Complete authentication workflows
- ✅ Shopping list CRUD operations
- ✅ File upload/download security
- ✅ Cross-service data flow
- ✅ Error handling and recovery

## Continuous Testing Strategy

### Pre-Commit Testing
1. Run security-focused tests
2. Validate input sanitization
3. Check authentication coverage

### CI/CD Integration
1. Full test suite execution
2. Coverage threshold enforcement
3. Security vulnerability scanning
4. Dependency audit checks

### Security Testing Schedule
- **Daily**: Automated security test runs
- **Weekly**: Dependency vulnerability scans
- **Monthly**: Comprehensive security review
- **Quarterly**: Penetration testing consideration

## Test Maintenance

### Adding New Tests
1. Start with security considerations
2. Test integration points
3. Include edge cases and error scenarios
4. Maintain consistent naming conventions

### Refactoring Tests
1. Update tests when changing public interfaces
2. Maintain security test coverage
3. Keep integration tests focused on behavior
4. Remove obsolete tests promptly

### Debugging Test Issues
1. Check mock configurations first
2. Verify Firebase provider mocks
3. Ensure async operations are properly awaited
4. Check TypeScript configuration compatibility

## Security Test Examples

### Authentication Bypass Prevention
```typescript
describe('Route Protection', () => {
  it('should block unauthenticated access', () => {
    mockAuth.currentUser = null;
    expect(authGuard.canActivate(route, state)).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/sign-in']);
  });
});
```

### Input Validation Security
```typescript
describe('Input Security', () => {
  it('should prevent XSS in user inputs', async () => {
    const xssPayload = '<script>alert("xss")</script>';
    await expect(service.createItem(xssPayload)).rejects.toThrow();
  });
});
```

### File Upload Security
```typescript
describe('File Security', () => {
  it('should prevent malicious file uploads', async () => {
    const maliciousFile = new File(['evil'], 'virus.exe', { type: 'application/octet-stream' });
    await expect(service.uploadFile(maliciousFile)).rejects.toThrow('Invalid file type');
  });
});
```

## Best Practices

### Security Testing
1. **Test all authentication paths**
2. **Validate all user inputs**
3. **Test file upload restrictions**
4. **Verify error message sanitization**
5. **Test user data isolation**

### Integration Testing
1. **Test complete user workflows**
2. **Mock external dependencies consistently**
3. **Test error boundaries**
4. **Verify state management**
5. **Test cross-component communication**

### Maintainable Testing
1. **Use descriptive test names**
2. **Group related tests logically**
3. **Keep tests independent**
4. **Mock at service boundaries**
5. **Test behavior, not implementation**

## Performance Considerations

### Test Execution Speed
- Use `--maxWorkers=1` for debugging
- Skip coverage during development with `--no-coverage`
- Use focused tests with `--testPathPattern`

### Memory Usage
- Clear mocks between tests
- Avoid large test data sets
- Use `TestBed.resetTestingModule()` when needed

## Troubleshooting

### Common Issues
1. **Firebase Mock Issues**: Ensure all Firebase services are properly mocked
2. **TypeScript Errors**: Check mock type compatibility
3. **Async Test Issues**: Use proper async/await patterns
4. **Coverage Issues**: Verify file paths in coverage configuration

### Debug Commands
```bash
# Debug specific test with verbose output
npm test -- --testPathPattern="auth.service" --verbose --no-coverage

# Run single test file
npm test -- src/app/services/auth.service.spec.ts

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

This testing strategy ensures comprehensive coverage while maintaining security focus and enabling safe refactoring of the codebase.