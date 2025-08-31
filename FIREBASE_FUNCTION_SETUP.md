# Firebase Function Setup for Recipe Scraping

This guide explains how to deploy the recipe scraping Firebase function that powers the new recipe import feature.

## Prerequisites

1. Firebase CLI installed: `npm install -g firebase-tools`
2. Node.js 18+ installed
3. Firebase project created

## Setup Steps

### 1. Initialize Firebase Functions

```bash
# Navigate to your StayHungry project
cd /path/to/StayHungry

# Initialize Firebase (if not already done)
firebase init

# Select Functions when prompted
# Choose TypeScript
# Use ESLint
# Install dependencies with npm
```

### 2. Copy Function Code

Copy the Firebase function code from `D:\Vibe\Shopping_3000\functions\src` to your new functions directory:

```bash
# Create functions directory structure
mkdir -p functions/src

# Copy the function files
cp -r "D:\Vibe\Shopping_3000\functions\src\*" functions/src/
```

### 3. Install Dependencies

```bash
cd functions
npm install cheerio node-fetch puppeteer-extra puppeteer-extra-plugin-stealth zod
```

### 4. Update package.json

Ensure your `functions/package.json` includes:

```json
{
  "name": "functions",
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "serve": "npm run build && firebase emulators:start --only functions",
    "shell": "npm run build && firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "engines": {
    "node": "18"
  },
  "main": "lib/index.js",
  "dependencies": {
    "cheerio": "^1.0.0-rc.12",
    "firebase-admin": "^11.8.0",
    "firebase-functions": "^4.3.1",
    "node-fetch": "^3.3.0",
    "puppeteer-extra": "^3.3.6",
    "puppeteer-extra-plugin-stealth": "^2.11.2",
    "zod": "^3.21.4"
  },
  "devDependencies": {
    "@types/node": "^18.11.9",
    "typescript": "^4.9.0"
  },
  "private": true
}
```

### 5. Configure Firebase

Update your `firebase.json`:

```json
{
  "functions": {
    "source": "functions",
    "runtime": "nodejs18"
  }
}
```

### 6. Deploy the Function

```bash
# Build the function
cd functions
npm run build

# Deploy to Firebase
firebase deploy --only functions
```

### 7. Update App Configuration

After deployment, update the API URL in `src/app/services/recipe-scraping.service.ts`:

```typescript
private readonly API_BASE_URL = 'https://your-region-your-project.cloudfunctions.net';
```

Replace with your actual Firebase function URL from the deployment output.

## Testing the Function

### Local Testing

```bash
# Start Firebase emulators
firebase emulators:start

# Test with curl
curl -X POST http://localhost:5001/your-project/your-region/parseRecipe \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.k-ruoka.fi/reseptit/lime-kookoskana"}'
```

### Production Testing

```bash
# Test deployed function
curl -X POST https://your-region-your-project.cloudfunctions.net/parseRecipe \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.k-ruoka.fi/reseptit/lime-kookoskana"}'
```

## Supported Websites

The function supports scraping from:

- **K-Ruoka.fi** - Finnish recipe website
- **Valio.fi** - Finnish dairy recipes  
- **Kotikokki.net** - Finnish cooking community
- **Other sites** - Any site with JSON-LD structured data

## Function Features

- **Multiple extraction methods**: Static HTML, Puppeteer with stealth
- **JSON-LD parsing**: Extracts structured recipe data
- **Fallback parsing**: HTML structure parsing for unsupported sites
- **Error handling**: Comprehensive error reporting
- **CORS support**: Configured for web app access
- **Validation**: Zod schema validation for recipe data

## Security Considerations

- Function is configured with CORS for web access
- Input validation for URLs
- Error messages don't expose internal details
- Rate limiting should be configured for production

## Monitoring

Monitor function usage in Firebase Console:
- Function logs
- Performance metrics
- Error rates
- Execution times

## Troubleshooting

### Common Issues

1. **CORS errors**: Ensure CORS is properly configured
2. **Timeout errors**: Increase timeout for complex sites
3. **Memory issues**: Increase memory allocation if needed
4. **Puppeteer errors**: Ensure proper browser arguments

### Debug Mode

Enable debug logging by setting environment variables:

```bash
firebase functions:config:set debug.enabled=true
```

## Cost Optimization

- Use static HTML parsing when possible (cheaper)
- Fallback to Puppeteer only when needed (more expensive)
- Implement caching for frequently scraped recipes
- Monitor function execution times and costs
