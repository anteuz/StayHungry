# AGENTS.md

## Project Overview

StayHungry is an Ionic Angular application for shopping lists and recipe management with Firebase backend. This project follows **Test-Driven Development (TDD)**, **SOLID principles**, **Clean Architecture**, and **2025 web development best practices**.

## Development Philosophy

### TDD Workflow (MANDATORY)
1. **Write failing test first** - Define the interface/contract
2. **Write minimal implementation** - Make the test pass
3. **Refactor** - Improve code while keeping tests green
4. **Repeat** - Never write implementation without a test

### Testing Principles
- **Test interfaces, not implementations** - Tests should only break when public contracts change
- **100% test coverage required** - All code paths must be tested
- **Mock external dependencies** - Use dependency injection and interfaces
- **Test behavior, not structure** - Focus on what the code does, not how it does it

## Setup Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run tests with coverage
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Build for production
npm run build

# Build for production with analysis
npm run build:analyze

# Run e2e tests
npm run e2e

# Deploy to Firebase
firebase deploy
```

## Code Style & Architecture

### TypeScript Configuration
- **Strict mode enabled** - All TypeScript strict flags active
- **Single quotes** - Use single quotes for strings
- **No semicolons** - Follow Angular style guide
- **Interface-first design** - Define contracts before implementations

### SOLID Principles Implementation
- **Single Responsibility** - Each class/module has one reason to change
- **Open/Closed** - Open for extension, closed for modification
- **Liskov Substitution** - Implementations must be substitutable
- **Interface Segregation** - Small, focused interfaces
- **Dependency Inversion** - Depend on abstractions, not concretions

### Clean Architecture Layers
```
src/app/
├── core/           # Domain entities, use cases, interfaces
├── infrastructure/ # External concerns (Firebase, storage)
├── presentation/   # UI components, pages
└── shared/         # Common utilities, pipes, directives
```

## Testing Instructions

### Test Structure
```typescript
// Always test the public interface
describe('ServiceName', () => {
  let service: ServiceName;
  let mockDependency: jest.Mocked<DependencyInterface>;

  beforeEach(() => {
    // Setup mocks for all dependencies
    mockDependency = createMockDependency();
    
    TestBed.configureTestingModule({
      providers: [
        ServiceName,
        { provide: DependencyInterface, useValue: mockDependency }
      ]
    });
    
    service = TestBed.inject(ServiceName);
  });

  it('should perform expected behavior', () => {
    // Arrange
    const input = 'test';
    mockDependency.method.mockReturnValue('expected');
    
    // Act
    const result = service.method(input);
    
    // Assert
    expect(result).toBe('expected');
    expect(mockDependency.method).toHaveBeenCalledWith(input);
  });
});
```

### Coverage Requirements
- **100% line coverage** - Every line of code executed
- **100% branch coverage** - All conditional paths tested
- **100% function coverage** - All functions called
- **Interface testing** - Test public contracts, not private methods

### Test Categories
1. **Unit Tests** - Test individual functions/classes in isolation
2. **Integration Tests** - Test component interactions
3. **E2E Tests** - Test complete user workflows
4. **Performance Tests** - Test load times and memory usage

## Performance & Web Standards

### Lighthouse Score Targets
- **Performance**: 90+
- **Accessibility**: 95+
- **Best Practices**: 95+
- **SEO**: 90+

### Performance Optimizations
- **Lazy loading** - All routes and modules
- **Tree shaking** - Remove unused code
- **Code splitting** - Split bundles by route
- **Image optimization** - WebP format, responsive images
- **Service Worker** - Offline functionality, caching
- **Bundle analysis** - Monitor bundle sizes

### Accessibility (A11y)
- **WCAG 2.1 AA compliance** - All components
- **Keyboard navigation** - Full keyboard support
- **Screen reader support** - ARIA labels, semantic HTML
- **Color contrast** - 4.5:1 minimum ratio
- **Focus management** - Visible focus indicators

## Firebase Best Practices

### Security Rules
```javascript
// Database rules - principle of least privilege
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

### Data Structure
- **User-centric design** - Data organized by user ID
- **Denormalization** - Optimize for read patterns
- **Security by design** - Rules enforce data access

### Authentication
- **Email/password** - Primary auth method
- **Social auth** - Google, Apple (iOS)
- **Anonymous auth** - Guest mode support
- **Token refresh** - Automatic token management

### Analytics & Monitoring
- **Firebase Analytics** - User behavior tracking
- **Crashlytics** - Error monitoring
- **Performance Monitoring** - App performance metrics
- **Custom events** - Business-specific tracking

## Security & Privacy

### Data Protection
- **GDPR compliance** - Data minimization, user consent
- **Encryption at rest** - Firebase handles encryption
- **HTTPS only** - All communications encrypted
- **Input validation** - Sanitize all user inputs
- **XSS prevention** - Angular's built-in protection

### Privacy Features
- **Data deletion** - User can delete all data
- **Consent management** - Granular permissions
- **Anonymization** - PII protection
- **Audit logging** - Track data access

## Development Workflow

### Git Workflow
1. **Feature branches** - Create from main
2. **TDD commits** - Test first, then implementation
3. **Atomic commits** - One logical change per commit
4. **Pull requests** - Code review required
5. **Squash merge** - Clean history

### Commit Message Format
```
[type] [scope]: [description]

[body]

[footer]
```

Types: `feat`, `fix`, `test`, `refactor`, `docs`, `perf`, `ci`

### Pre-commit Hooks
- **Linting** - ESLint, TSLint
- **Type checking** - TypeScript compilation
- **Tests** - All tests must pass
- **Coverage** - Maintain 100% coverage
- **Security scan** - Dependency vulnerabilities

## Quality Assurance

### Code Quality Tools
- **ESLint** - Code style enforcement
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **Lint-staged** - Pre-commit checks

### Performance Monitoring
- **Bundle analyzer** - Monitor bundle sizes
- **Lighthouse CI** - Automated performance testing
- **Web Vitals** - Core Web Vitals tracking
- **Memory profiling** - Detect memory leaks

### Error Handling
- **Global error handler** - Catch unhandled errors
- **User-friendly messages** - Don't expose technical details
- **Error reporting** - Firebase Crashlytics
- **Graceful degradation** - App works offline

## Deployment

### Environment Configuration
- **Development** - Local Firebase emulators
- **Staging** - Separate Firebase project
- **Production** - Production Firebase project

### CI/CD Pipeline
1. **Code quality checks** - Lint, test, coverage
2. **Security scan** - Dependency vulnerabilities
3. **Performance test** - Lighthouse scores
4. **Build** - Production build
5. **Deploy** - Firebase hosting

### Monitoring
- **Uptime monitoring** - Service availability
- **Error tracking** - Real-time error alerts
- **Performance metrics** - Response times, throughput
- **User analytics** - Usage patterns, feature adoption

## Troubleshooting

### Common Issues
- **Test failures** - Check mock setup and dependencies
- **Build errors** - Verify TypeScript strict mode compliance
- **Performance issues** - Run bundle analyzer
- **Firebase errors** - Check security rules and authentication

### Debug Commands
```bash
# Debug tests
npm run test:debug

# Analyze bundle
npm run build:analyze

# Check Firebase rules
firebase emulators:start

# Performance audit
npm run lighthouse
```

## Resources

- [Angular Style Guide](https://angular.io/guide/styleguide)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Ionic Framework](https://ionicframework.com/docs)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)
- [Web Vitals](https://web.dev/vitals/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Remember**: Always write tests first, focus on interfaces over implementations, and maintain 100% test coverage. Performance and accessibility are not afterthoughts - they are requirements from day one.
