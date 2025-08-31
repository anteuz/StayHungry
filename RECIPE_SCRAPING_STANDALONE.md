# Standalone Recipe Scraping Service

This document describes the standalone recipe scraping service implementation that allows the StayHungry app to extract recipes from URLs without requiring Firebase functions.

## Overview

The standalone recipe scraping service provides a complete solution for extracting recipe data from various websites using browser APIs and web scraping techniques. It includes multiple fallback strategies and supports both JSON-LD structured data and site-specific parsing.

## Architecture

### Service Layers

1. **UnifiedRecipeScrapingService** - Main entry point that switches between standalone and Firebase modes
2. **StandaloneRecipeScrapingService** - Core standalone scraping implementation
3. **RecipeScrapingConfigService** - Configuration management for scraping settings

### Key Features

- **Multiple Extraction Methods**: JSON-LD, site-specific parsing, generic fallback
- **CORS Proxy Support**: Multiple proxy options for cross-origin requests
- **Site-Specific Parsers**: Optimized for K-Ruoka, Kotikokki.net, and other Finnish recipe sites
- **Fallback Strategy**: Automatic fallback between different extraction methods
- **Configuration Management**: Runtime configuration switching between standalone and Firebase modes

## Services

### UnifiedRecipeScrapingService

The main service that provides a unified interface for recipe scraping, automatically switching between standalone and Firebase function modes based on configuration.

```typescript
// Usage
const result = await this.unifiedService.scrapeRecipeFromUrl(url).toPromise();
```

**Key Methods:**
- `scrapeRecipeFromUrl(url: string)` - Main scraping method
- `convertScrapedToRecipe(scrapedRecipe: ScrapedRecipe)` - Convert to app format
- `validateUrl(url: string)` - URL validation
- `testConfiguration()` - Test current configuration
- `enableStandaloneMode()` / `enableFirebaseMode()` - Switch modes

### StandaloneRecipeScrapingService

The core standalone implementation that handles recipe extraction without external dependencies.

**Extraction Strategy:**
1. **CORS Proxy** - Primary method using allorigins.win
2. **Direct Fetch** - Fallback for same-origin or CORS-allowed sites
3. **Alternative Proxies** - Multiple proxy options as final fallback

**Supported Sites:**
- **K-Ruoka.fi** - Finnish grocery store recipes
- **Kotikokki.net** - Finnish recipe community
- **Generic Sites** - Any site with JSON-LD or structured HTML

### RecipeScrapingConfigService

Manages configuration for the scraping service, including mode switching and proxy settings.

**Configuration Options:**
- `useStandalone: boolean` - Enable/disable standalone mode
- `firebaseFunctionUrl: string` - Firebase function endpoint
- `corsProxyUrl: string` - Primary CORS proxy
- `timeoutMs: number` - Request timeout
- `maxRetries: number` - Retry attempts

## Usage Examples

### Basic Recipe Scraping

```typescript
import { UnifiedRecipeScrapingService } from './services/unified-recipe-scraping.service';

constructor(private recipeScrapingService: UnifiedRecipeScrapingService) {}

async scrapeRecipe() {
  const url = 'https://www.k-ruoka.fi/reseptit/lime-kookoskana';
  
  try {
    const result = await this.recipeScrapingService.scrapeRecipeFromUrl(url).toPromise();
    
    if (result.status === 'ok' && result.recipe) {
      const recipe = this.recipeScrapingService.convertScrapedToRecipe(result.recipe);
      console.log('Recipe extracted:', recipe);
    }
  } catch (error) {
    console.error('Scraping failed:', error);
  }
}
```

### Configuration Management

```typescript
// Switch to standalone mode
this.recipeScrapingService.enableStandaloneMode();

// Test configuration
const testResult = await this.recipeScrapingService.testConfiguration().toPromise();
console.log('Configuration test:', testResult);

// Get current configuration
const config = this.recipeScrapingService.getConfiguration();
console.log('Current config:', config);
```

### Advanced Configuration

```typescript
// Update configuration
this.recipeScrapingService.updateConfiguration({
  timeoutMs: 60000,
  maxRetries: 5,
  corsProxyUrl: 'https://alternative-proxy.com/'
});

// Get available CORS proxies
const proxies = this.recipeScrapingService.getAvailableCorsProxies();
console.log('Available proxies:', proxies);
```

## Extraction Methods

### 1. JSON-LD Extraction

Extracts structured recipe data from JSON-LD scripts embedded in HTML.

```html
<script type="application/ld+json">
{
  "@type": "Recipe",
  "name": "Chocolate Cake",
  "recipeIngredient": ["2 cups flour", "1 cup sugar"],
  "recipeInstructions": ["Mix ingredients", "Bake at 350F"]
}
</script>
```

### 2. Site-Specific Parsing

#### K-Ruoka.fi
- **Title**: `h1`, `.recipe-title`, `.title`
- **Ingredients**: `.ingredient`, `.recipe-ingredient`, `[data-ingredient]`
- **Instructions**: `.instruction`, `.recipe-instruction`, `.step`
- **Description**: `.description`, `.recipe-description`, `.summary`
- **Image**: `.recipe-image img`, `.main-image img`

#### Kotikokki.net
- **Title**: `h1`
- **Ingredients**: Table format with `td` cells
- **Instructions**: `p` elements with instruction text
- **Special handling**: Finnish recipe structure

### 3. Generic Parsing

Fallback method that looks for common recipe patterns:
- **Title**: `h1`, `.recipe-title`, `[itemprop="name"]`
- **Ingredients**: `[itemprop="recipeIngredient"]`, `.ingredient`
- **Instructions**: `[itemprop="recipeInstructions"]`, `.instruction`, `ol li`, `ul li`
- **Description**: `[itemprop="description"]`, `.description`
- **Image**: `[itemprop="image"] img`, `.recipe-image img`

## CORS Proxy Strategy

The service uses multiple CORS proxies to ensure reliable access to external websites:

1. **Primary**: `https://api.allorigins.win/raw?url=`
2. **Fallback 1**: `https://cors-anywhere.herokuapp.com/`
3. **Fallback 2**: `https://thingproxy.freeboard.io/fetch/`
4. **Fallback 3**: `https://api.codetabs.com/v1/proxy?quest=`

## Error Handling

The service implements comprehensive error handling:

- **Network Errors**: Automatic retry with different proxies
- **Parse Errors**: Fallback to alternative extraction methods
- **CORS Errors**: Switch between proxy options
- **Timeout Errors**: Configurable timeout with retry logic

## Testing

### Unit Tests

The service includes comprehensive unit tests covering:
- URL validation
- Recipe conversion
- Error handling
- Configuration management
- Integration scenarios

### Test Coverage

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific service tests
npm test -- --testNamePattern="StandaloneRecipeScrapingService"
```

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**: Services are loaded only when needed
2. **Caching**: Configuration is cached in localStorage
3. **Timeout Management**: Configurable timeouts prevent hanging requests
4. **Retry Logic**: Intelligent retry with exponential backoff
5. **Proxy Rotation**: Automatic switching between proxy services

### Memory Management

- **DOM Parsing**: Uses DOMParser for efficient HTML parsing
- **Resource Cleanup**: Automatic cleanup of temporary DOM elements
- **Stream Processing**: Processes HTML content as streams when possible

## Security Considerations

### Input Validation

- **URL Validation**: Strict URL format validation
- **Content Sanitization**: HTML content is parsed safely
- **CORS Compliance**: Respects CORS policies and uses appropriate proxies

### Privacy Protection

- **No Data Collection**: Service doesn't collect or store user data
- **Local Processing**: All processing happens client-side
- **Secure Proxies**: Uses trusted CORS proxy services

## Deployment

### Configuration

1. **Default Mode**: Set to standalone mode by default
2. **Firebase Integration**: Optional Firebase function URL configuration
3. **Proxy Selection**: Automatic proxy selection with manual override option

### Environment Variables

```typescript
// Optional environment configuration
const config = {
  useStandalone: true,
  firebaseFunctionUrl: process.env.FIREBASE_FUNCTION_URL,
  corsProxyUrl: process.env.CORS_PROXY_URL || 'https://api.allorigins.win/raw?url=',
  timeoutMs: parseInt(process.env.SCRAPING_TIMEOUT) || 30000
};
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Check proxy configuration and try alternative proxies
2. **Parse Failures**: Verify HTML structure and try site-specific parsing
3. **Timeout Issues**: Increase timeout configuration
4. **Network Errors**: Check internet connectivity and proxy availability

### Debug Information

The service provides detailed debug information:

```typescript
const result = await this.recipeScrapingService.scrapeRecipeFromUrl(url).toPromise();
console.log('Debug info:', result.debug);
```

### Logging

Enable detailed logging for troubleshooting:

```typescript
// In development
console.log('Scraping debug:', {
  url,
  extractionMethod: result.extractionMethod,
  debug: result.debug
});
```

## Future Enhancements

### Planned Features

1. **More Site Support**: Additional Finnish and international recipe sites
2. **AI-Powered Extraction**: Machine learning for better content recognition
3. **Offline Support**: Cached recipe extraction for offline use
4. **Performance Monitoring**: Real-time performance metrics
5. **User Feedback**: Community-driven site parser improvements

### Extensibility

The service is designed for easy extension:

```typescript
// Add new site parser
private extractCustomSiteRecipe(doc: Document, url: string): ScrapedRecipe | null {
  // Custom parsing logic
  return {
    name: 'Custom Recipe',
    recipeIngredient: ['ingredient'],
    recipeInstructions: ['instruction'],
    sourceUrl: url
  };
}
```

## Contributing

### Adding New Site Support

1. **Identify Site Patterns**: Analyze HTML structure
2. **Create Parser**: Implement site-specific extraction logic
3. **Add Tests**: Create comprehensive test cases
4. **Update Documentation**: Document new site support

### Code Standards

- **TypeScript**: Strict typing throughout
- **TDD**: Test-driven development approach
- **SOLID Principles**: Clean architecture implementation
- **Error Handling**: Comprehensive error management
- **Documentation**: Inline and external documentation

## License

This implementation follows the project's existing license and coding standards as defined in AGENTS.md.
