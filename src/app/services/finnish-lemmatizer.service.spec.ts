import { TestBed } from '@angular/core/testing';
import { FinnishLemmatizerService } from './finnish-lemmatizer.service';

describe('FinnishLemmatizerService', () => {
  let service: FinnishLemmatizerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FinnishLemmatizerService]
    });
    service = TestBed.inject(FinnishLemmatizerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('lemmatizeWord', () => {
    it('should handle special cases correctly', () => {
      const testCases = [
        { input: 'tomaatteja', expected: 'tomaatti', confidence: 1.0 },
        { input: 'broilerin', expected: 'broileri', confidence: 1.0 },
        { input: 'oliiviöljyä', expected: 'oliiviöljy', confidence: 1.0 },
        { input: 'parmesanraastetta', expected: 'parmesan', confidence: 1.0 },
        { input: 'mustapippuria', expected: 'mustapippuri', confidence: 1.0 },
        { input: 'suolaa', expected: 'suola', confidence: 1.0 },
        { input: 'timjaminlehtiä', expected: 'timjami', confidence: 1.0 },
        { input: 'valkosipulinkynttä', expected: 'valkosipuli', confidence: 1.0 }
      ];

      testCases.forEach(({ input, expected, confidence }) => {
        const result = service.lemmatizeWord(input);
        expect(result.basicForm).toBe(expected);
        expect(result.confidence).toBe(confidence);
      });
    });

    it('should handle compound words correctly', () => {
      const testCases = [
        { input: 'aurinkokuivattuja', expected: 'tomaatti', confidence: 1.0 },
        { input: 'tuoreita', expected: 'tuoreita', confidence: 1.0 },
        { input: 'pakastekalaa', expected: 'kalaa', confidence: 0.8 }
      ];

      testCases.forEach(({ input, expected, confidence }) => {
        const result = service.lemmatizeWord(input);
        expect(result.basicForm).toBe(expected);
        expect(result.confidence).toBe(confidence);
      });
    });

    it('should handle inflection patterns correctly', () => {
      const testCases = [
        { input: 'maitoa', expected: 'maito', confidence: 1.0 },
        { input: 'juustoa', expected: 'juusto', confidence: 1.0 },
        { input: 'kermaa', expected: 'kerma', confidence: 1.0 }
      ];

      testCases.forEach(({ input, expected, confidence }) => {
        const result = service.lemmatizeWord(input);
        expect(result.basicForm).toBe(expected);
        expect(result.confidence).toBe(confidence);
      });
    });
  });

  describe('lemmatizePhrase', () => {
    it('should lemmatize phrases correctly', () => {
      const testCases = [
        { input: 'aurinkokuivattuja tomaatteja', expected: 'tomaatti tomaatti' },
        { input: 'broilerin rintafileitä', expected: 'broileri fileitä' },
        { input: 'ripaus mustapippuria', expected: 'ripaus mustapippuri' },
        { input: 'tuoreita timjaminlehtiä', expected: 'tuoreita timjami' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = service.lemmatizePhrase(input);
        expect(result).toBe(expected);
      });
    });
  });

  describe('extractKeyWords', () => {
    it('should extract relevant keywords correctly', () => {
      const testCases = [
        { input: 'aurinkokuivattuja tomaatteja', expected: ['tomaatti'] },
        { input: 'broilerin rintafileitä', expected: ['broileri'] },
        { input: 'oliiviöljyä', expected: ['oliiviöljy'] },
        { input: 'parmesanraastetta', expected: ['parmesan'] },
        { input: 'ripaus mustapippuria', expected: ['mustapippuri'] },
        { input: 'ripaus suolaa', expected: ['suola'] },
        { input: 'tuoreita timjaminlehtiä', expected: ['timjami'] },
        { input: 'valkosipulinkynttä', expected: ['valkosipuli'] }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = service.extractKeyWords(input);
        expect(result).toEqual(expected);
      });
    });
  });

  describe('getMostRelevantWord', () => {
    it('should return the most relevant word for category detection', () => {
      const testCases = [
        { input: 'aurinkokuivattuja tomaatteja', expected: 'tomaatti' },
        { input: 'broilerin rintafileitä', expected: 'broileri' },
        { input: 'oliiviöljyä', expected: 'oliiviöljy' },
        { input: 'parmesanraastetta', expected: 'parmesan' },
        { input: 'ripaus mustapippuria', expected: 'mustapippuri' },
        { input: 'ripaus suolaa', expected: 'suola' },
        { input: 'tuoreita timjaminlehtiä', expected: 'timjami' },
        { input: 'valkosipulinkynttä', expected: 'valkosipuli' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = service.getMostRelevantWord(input);
        expect(result).toBe(expected);
      });
    });
  });
});
