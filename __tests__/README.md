# Testing Setup and Instructions

## Install Jest Dependencies

Before running tests, install the required Jest packages:

```bash
npm install --save-dev jest @types/jest jest-environment-node ts-jest @jest/globals
```

Or with yarn:

```bash
yarn add -D jest @types/jest jest-environment-node ts-jest @jest/globals
```

## Update package.json Scripts

Add the following test script to your `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test -- __tests__/lib/langchain.test.ts
```

## Test Structure

### lib/langchain.test.ts

Comprehensive unit tests for `lib/langchain.ts`:

**Test Coverage:**
- ✅ `generateEmbedding()` - Wrapper function for embeddings
- ✅ `chunkText()` - Text chunking with various scenarios:
  - Short text (single chunk)
  - Sentence boundary splitting
  - Long text without sentences
  - Respect maxLen parameter
  - Multiple sentence types (., ?, !)
  - Empty string handling
  
- ✅ `analyzeFeedback()` - AI analysis with extensive scenarios:
  - **Sentiment validation**: Ensures sentiment is in allowed set ['positive', 'neutral', 'negative', 'mixed']
  - **Topics array**: Validates topics array length >= 1
  - **Summary**: Ensures non-empty summary string
  - **Recommendation**: Ensures non-empty recommendation string
  - **All sentiment types**: positive, negative, neutral, mixed
  - **JSON parsing**: Handles markdown code blocks, invalid JSON
  - **Error handling**: Graceful fallbacks for API errors
  - **Data filtering**: Removes non-string topics
  - **Confidence scores**: Validates sentiment_score field

**Mocking Strategy:**
- Uses `jest.mock()` to mock `lib/openai` module
- `embedText` returns deterministic array of random numbers
- `runLLM` returns JSON strings with controlled responses
- Each test sets up specific mock responses for scenarios

## Environment Variables

Tests automatically use mock environment variables (set in `jest.setup.js`):
- `OPENAI_API_KEY=test-api-key`
- `OPENAI_EMBED_MODEL=text-embedding-3-small`
- `OPENAI_LLM_MODEL=gpt-4o-mini`

## File Structure

```
__tests__/
├── README.md                    # This file
└── lib/
    └── langchain.test.ts        # langchain.ts unit tests

jest.config.js                   # Jest configuration
jest.setup.js                    # Test environment setup
tsconfig.test.json              # TypeScript config for tests
```

## Troubleshooting

### TypeScript Errors

If you see TypeScript errors about Jest types:
1. Ensure `@types/jest` is installed
2. Check that `tsconfig.test.json` includes Jest types
3. Restart your TypeScript server in your IDE

### Module Resolution

If tests can't find modules with `@/` imports:
1. Check `jest.config.js` has correct `moduleNameMapper`
2. Ensure paths match your project structure

### Mock Issues

If mocks aren't working:
1. Verify `jest.mock()` is called before any imports use the module
2. Clear mock calls with `jest.clearAllMocks()` in `beforeEach()`
3. Check mock return values match expected function signatures

## Writing New Tests

When adding new test files:

1. Create file in `__tests__/` directory with `.test.ts` or `.test.tsx` extension
2. Add triple-slash directive at top: `/// <reference types="jest" />`
3. Import functions to test and mock dependencies
4. Use `describe()` blocks to group related tests
5. Use `beforeEach()` for setup, `afterEach()` for cleanup
6. Write clear test names describing expected behavior

Example:

```typescript
/// <reference types="jest" />

import { myFunction } from '@/lib/myModule';

describe('myModule', () => {
  beforeEach(() => {
    // Setup
  });

  it('should do something specific', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });
});
```

## Test Quality Guidelines

- **Descriptive names**: Test names should clearly state what they're testing
- **Arrange-Act-Assert**: Structure tests with clear setup, execution, and assertion phases
- **Mock external dependencies**: Don't make real API calls in unit tests
- **Test edge cases**: Include tests for error conditions, empty inputs, boundary values
- **Keep tests isolated**: Each test should be independent and not rely on others
- **Avoid test interdependence**: Use `beforeEach()` to ensure fresh state

## Coverage Goals

Aim for:
- **Functions**: 80%+ coverage
- **Statements**: 80%+ coverage
- **Branches**: 70%+ coverage
- **Lines**: 80%+ coverage

Focus on testing critical business logic and error handling paths.

