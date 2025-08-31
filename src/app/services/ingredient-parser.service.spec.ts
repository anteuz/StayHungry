import { TestBed } from '@angular/core/testing';
import { IngredientParserService } from './ingredient-parser.service';
import { SimpleItemService } from './simple-item.service';
import { ThemeService } from './theme.service';
import { IngredientParserResult } from '../models/ingredient-parser-result';

describe('IngredientParserService', () => {
  let service: IngredientParserService;
  let mockItemService: jest.Mocked<SimpleItemService>;
  let mockThemeService: jest.Mocked<ThemeService>;

  beforeEach(() => {
    mockItemService = {
      filterItems: jest.fn(),
      incrementUsage: jest.fn(),
      updateItem: jest.fn(),
      addItem: jest.fn()
    } as any;

    mockThemeService = {
      getCategoryVariable: jest.fn().mockReturnValue('--ion-color-category-other')
    } as any;

    TestBed.configureTestingModule({
      providers: [
        IngredientParserService,
        { provide: SimpleItemService, useValue: mockItemService },
        { provide: ThemeService, useValue: mockThemeService }
      ]
    });

    service = TestBed.inject(IngredientParserService);
  });

  describe('parseIngredientText', () => {
    describe('range amounts', () => {
      it('should parse range amounts with redundant measure and use greater number', () => {
        const result = service.parseIngredientText('2-3 (500 g) omena');
        
        expect(result.amount).toBe('3');
        expect(result.itemName).toBe('omena');
        expect(result.metadata?.redundantMeasure).toBe('500 g');
        expect(result.confidence).toBeGreaterThan(0.7);
      });

      it('should parse range amounts with units', () => {
        const result = service.parseIngredientText('1-2 dl maito');
        
        expect(result.amount).toBe('2 dl');
        expect(result.itemName).toBe('maito');
        expect(result.confidence).toBeGreaterThan(0.7);
      });

      it('should parse range amounts with kpl units', () => {
        const result = service.parseIngredientText('2-3 kpl banaani');
        
        expect(result.amount).toBe('3 kpl');
        expect(result.itemName).toBe('banaani');
        expect(result.confidence).toBeGreaterThan(0.7);
      });

      it('should handle single range number correctly', () => {
        const result = service.parseIngredientText('5-5 (200 g) juusto');
        
        expect(result.amount).toBe('5');
        expect(result.itemName).toBe('juusto');
        expect(result.metadata?.redundantMeasure).toBe('200 g');
      });
    });

    describe('sub-brands', () => {
      it('should parse main brand with sub-brand', () => {
        const result = service.parseIngredientText('Arla Lempi juusto');
        
        expect(result.brand).toBe('Arla');
        expect(result.metadata?.subBrand).toBe('Lempi');
        expect(result.itemName).toBe('juusto');
        expect(result.confidence).toBeGreaterThan(0.7);
      });

      it('should parse Valio with sub-brand', () => {
        const result = service.parseIngredientText('Valio Oltermanni juusto');
        
        expect(result.brand).toBe('Valio');
        expect(result.metadata?.subBrand).toBe('Oltermanni');
        expect(result.itemName).toBe('juusto');
      });

      it('should handle main brand without sub-brand', () => {
        const result = service.parseIngredientText('Arla maito');
        
        expect(result.brand).toBe('Arla');
        expect(result.metadata?.subBrand).toBeUndefined();
        expect(result.itemName).toBe('maito');
      });

      it('should not treat main brand names as sub-brands', () => {
        const result = service.parseIngredientText('Arla Valio juusto');
        
        expect(result.brand).toBe('Arla Valio');
        expect(result.metadata?.subBrand).toBeUndefined();
        expect(result.itemName).toBe('juusto');
      });
    });

    describe('combined scenarios', () => {
      it('should parse range amount with sub-brand', () => {
        const result = service.parseIngredientText('2-3 (500 g) Arla Lempi juusto');
        
        expect(result.amount).toBe('3');
        expect(result.brand).toBe('Arla');
        expect(result.metadata?.subBrand).toBe('Lempi');
        expect(result.metadata?.redundantMeasure).toBe('500 g');
        expect(result.itemName).toBe('juusto');
      });

      it('should parse range amount with sub-brand and temperature', () => {
        const result = service.parseIngredientText('1-2 dl Arla Lempi (pakaste) maito');
        
        expect(result.amount).toBe('2 dl');
        expect(result.brand).toBe('Arla');
        expect(result.metadata?.subBrand).toBe('Lempi');
        expect(result.metadata?.temperature).toBe('pakaste');
        expect(result.itemName).toBe('maito');
      });

      it('should parse range amount with sub-brand and preparation', () => {
        const result = service.parseIngredientText('2-3 kpl kuivattu Arla Lempi omena');
        
        expect(result.amount).toBe('3 kpl');
        expect(result.brand).toBe('Arla');
        expect(result.metadata?.subBrand).toBe('Lempi');
        expect(result.metadata?.preparation).toBe('kuivattu');
        expect(result.itemName).toBe('omena');
      });
    });

    describe('existing functionality', () => {
      it('should parse standard amounts', () => {
        const result = service.parseIngredientText('2 dl maito');
        
        expect(result.amount).toBe('2 dl');
        expect(result.itemName).toBe('maito');
        expect(result.confidence).toBeGreaterThan(0.7);
      });

      it('should parse decimal amounts', () => {
        const result = service.parseIngredientText('1.5 kg peruna');
        
        expect(result.amount).toBe('1.5 kg');
        expect(result.itemName).toBe('peruna');
      });

      it('should parse fraction amounts', () => {
        const result = service.parseIngredientText('1/2 dl öljy');
        
        expect(result.amount).toBe('1/2 dl');
        expect(result.itemName).toBe('öljy');
      });

      it('should parse package amounts', () => {
        const result = service.parseIngredientText('1 pkt (6 kpl/500 g) banaani');
        
        expect(result.amount).toBe('1 pkt');
        expect(result.metadata?.packageSize).toBe('6 kpl/500 g');
        expect(result.itemName).toBe('banaani');
      });

      it('should handle temperature information', () => {
        const result = service.parseIngredientText('(pakaste) herneet');
        
        expect(result.metadata?.temperature).toBe('pakaste');
        expect(result.itemName).toBe('herneet');
      });

      it('should handle preparation methods', () => {
        const result = service.parseIngredientText('kuivattu persikka');
        
        expect(result.metadata?.preparation).toBe('kuivattu');
        expect(result.itemName).toBe('persikka');
      });
    });

    describe('edge cases', () => {
      it('should handle empty input', () => {
        const result = service.parseIngredientText('');
        
        expect(result.amount).toBe('');
        expect(result.itemName).toBe('');
        expect(result.confidence).toBe(0);
      });

      it('should handle null input', () => {
        const result = service.parseIngredientText(null as any);
        
        expect(result.amount).toBe('');
        expect(result.itemName).toBe('');
        expect(result.confidence).toBe(0);
      });

      it('should handle whitespace-only input', () => {
        const result = service.parseIngredientText('   ');
        
        expect(result.amount).toBe('');
        expect(result.itemName).toBe('');
        expect(result.confidence).toBe(0);
      });

      it('should handle text without amounts', () => {
        const result = service.parseIngredientText('omena');
        
        expect(result.amount).toBe('');
        expect(result.itemName).toBe('omena');
        expect(result.confidence).toBeGreaterThan(0.5);
      });
    });

    describe('real-world transformation tests', () => {
      it('should parse package with brand and temperature', () => {
        const result = service.parseIngredientText('1 pkt (6 kpl/500 g) Pirkka lehtitaikinalevyjä (pakaste)');
        
        expect(result.amount).toBe('1 pkt');
        expect(result.metadata?.packageSize).toBe('6 kpl/500 g');
        expect(result.brand).toBe('Pirkka');
        expect(result.itemName).toBe('lehtitaikinalevyjä');
        expect(result.metadata?.temperature).toBe('pakaste');
        expect(result.category).toBe('frozen');
      });

      it('should parse range amount with redundant measure', () => {
        const result = service.parseIngredientText('2–3 (500 g) isoa omenaa');
        
        expect(result.amount).toBe('3');
        expect(result.metadata?.redundantMeasure).toBe('500 g');
        expect(result.itemName).toBe('isoa omenaa');
        expect(result.category).toBe('fruits');
      });

      it('should parse simple amount with unit', () => {
        const result = service.parseIngredientText('1 dl sokeria');
        
        expect(result.amount).toBe('1 dl');
        expect(result.itemName).toBe('sokeria');
        expect(result.category).toBe('pantry');
      });

      it('should parse teaspoon amount', () => {
        const result = service.parseIngredientText('2 tl kanelia');
        
        expect(result.amount).toBe('2 tl');
        expect(result.itemName).toBe('kanelia');
        expect(result.category).toBe('pantry');
      });

      it('should parse single item without unit', () => {
        const result = service.parseIngredientText('1 kananmuna');
        
        expect(result.amount).toBe('1');
        expect(result.itemName).toBe('kananmuna');
        expect(result.category).toBe('meat'); // Eggs are categorized as meat
      });

      it('should parse package with sub-brand', () => {
        const result = service.parseIngredientText('1 prk (200 g) Arla Lempi crème fraîchea');
        
        expect(result.amount).toBe('1 prk');
        expect(result.metadata?.packageSize).toBe('200 g');
        expect(result.brand).toBe('Arla');
        expect(result.metadata?.subBrand).toBe('Lempi');
        expect(result.itemName).toBe('crème fraîchea');
      });

      it('should parse package with brand and description', () => {
        const result = service.parseIngredientText('1 pkt (350 g) Pirkka kanan paistileikkeitä, välimeri');
        
        expect(result.amount).toBe('1 pkt');
        expect(result.metadata?.packageSize).toBe('350 g');
        expect(result.brand).toBe('Pirkka');
        expect(result.itemName).toBe('kanan paistileikkeitä, välimeri');
      });

      it('should parse range amount with brand', () => {
        const result = service.parseIngredientText('1/2–1 Pirkka mietoa punaista chiliä hienonnettuna');
        
        expect(result.amount).toBe('1');
        expect(result.brand).toBe('Pirkka');
        expect(result.itemName).toBe('mietoa punaista chiliä');
        expect(result.metadata?.preparation).toBe('hienonnettuna');
      });

      it('should parse amount with preparation method', () => {
        const result = service.parseIngredientText('2 tl sitruunankuorta raastettuna');
        
        expect(result.amount).toBe('2 tl');
        expect(result.itemName).toBe('sitruunankuorta');
        expect(result.metadata?.preparation).toBe('raastettuna');
      });

      it('should parse package with brand and sub-brand', () => {
        const result = service.parseIngredientText('1 pkt (150 g) Pirkka Parhaat fetajuustoa');
        
        expect(result.amount).toBe('1 pkt');
        expect(result.metadata?.packageSize).toBe('150 g');
        expect(result.brand).toBe('Pirkka');
        expect(result.metadata?.subBrand).toBe('Parhaat');
        expect(result.itemName).toBe('fetajuustoa');
      });

      it('should parse tablespoon amount with brand', () => {
        const result = service.parseIngredientText('2 rkl Pirkka ekstra-neitsytoliiviöljyä');
        
        expect(result.amount).toBe('2 rkl');
        expect(result.brand).toBe('Pirkka');
        expect(result.itemName).toBe('ekstra-neitsytoliiviöljyä');
      });

      it('should parse descriptive amount', () => {
        const result = service.parseIngredientText('ripaus mustapippuria');
        
        expect(result.amount).toBe('');
        expect(result.itemName).toBe('ripaus mustapippuria');
        expect(result.category).toBe('pantry');
      });

      it('should parse weight amount', () => {
        const result = service.parseIngredientText('250 g spagettia');
        
        expect(result.amount).toBe('250 g');
        expect(result.itemName).toBe('spagettia');
        expect(result.category).toBe('grains');
      });

      it('should parse amount with parenthetical description and preparation', () => {
        const result = service.parseIngredientText('1 dl (lehti)persiljaa hienonnettuna');
        
        expect(result.amount).toBe('1 dl');
        expect(result.itemName).toBe('(lehti)persiljaa');
        expect(result.metadata?.preparation).toBe('hienonnettuna');
      });

      it('should parse approximate amount', () => {
        const result = service.parseIngredientText('n. 1 dl pastan keitinvettä');
        
        expect(result.amount).toBe('1 dl');
        expect(result.itemName).toBe('pastan keitinvettä');
        expect(result.metadata?.isApproximate).toBe(true);
      });

      it('should parse approximate amount with grams and remove n. prefix from item name', () => {
        const result = service.parseIngredientText('n. 800g karjalanpaisti lihaa');
        
        expect(result.amount).toBe('800 g');
        expect(result.itemName).toBe('karjalanpaisti lihaa');
        expect(result.confidence).toBeGreaterThan(0.7);
        expect(result.metadata?.isApproximate).toBe(true);
      });
    });

    describe('Finnish ingredient patterns', () => {
      it('should parse tablespoon amount with unnecessary metadata in parentheses', () => {
        const result = service.parseIngredientText('1 rkl tuoreita timjaminlehtiä (myös kuivattu käy)');
        
        expect(result.amount).toBe('1 rkl');
        expect(result.itemName).toBe('tuoreita timjaminlehtiä');
        expect(result.metadata?.unnecessaryMetadata).toBe('(myös kuivattu käy)');
        expect(result.confidence).toBeGreaterThan(0.7);
      });

      it('should parse decimal amount with comma notation', () => {
        const result = service.parseIngredientText('0,5 dl parmesanraastetta');
        
        expect(result.amount).toBe('0.5 dl');
        expect(result.itemName).toBe('parmesanraastetta');
        expect(result.confidence).toBeGreaterThan(0.7);
      });

      it('should parse amount with sun-dried description', () => {
        const result = service.parseIngredientText('1 dl aurinkokuivattuja tomaatteja');
        
        expect(result.amount).toBe('1 dl');
        expect(result.itemName).toBe('aurinkokuivattuja tomaatteja');
        expect(result.confidence).toBeGreaterThan(0.7);
      });

      it('should handle decimal amounts with comma in various units', () => {
        const result1 = service.parseIngredientText('0,25 kg jauhelihaa');
        const result2 = service.parseIngredientText('1,5 l vettä');
        const result3 = service.parseIngredientText('0,75 dl öljyä');
        
        expect(result1.amount).toBe('0.25 kg');
        expect(result1.itemName).toBe('jauhelihaa');
        expect(result2.amount).toBe('1.5 l');
        expect(result2.itemName).toBe('vettä');
        expect(result3.amount).toBe('0.75 dl');
        expect(result3.itemName).toBe('öljyä');
      });

      it('should extract unnecessary metadata from various positions', () => {
        const result1 = service.parseIngredientText('2 dl maitoa (tai kermaa)');
        const result2 = service.parseIngredientText('1 kpl omena (tai päärynä)');
        const result3 = service.parseIngredientText('3 tl sokeria (valkoinen tai ruskea)');
        
        expect(result1.amount).toBe('2 dl');
        expect(result1.itemName).toBe('maitoa');
        expect(result1.metadata?.unnecessaryMetadata).toBe('(tai kermaa)');
        
        expect(result2.amount).toBe('1 kpl');
        expect(result2.itemName).toBe('omena');
        expect(result2.metadata?.unnecessaryMetadata).toBe('(tai päärynä)');
        
        expect(result3.amount).toBe('3 tl');
        expect(result3.itemName).toBe('sokeria');
        expect(result3.metadata?.unnecessaryMetadata).toBe('(valkoinen tai ruskea)');
      });

      it('should handle Finnish units correctly', () => {
        const result1 = service.parseIngredientText('2 rkl öljyä');
        const result2 = service.parseIngredientText('1 tl suolaa');
        const result3 = service.parseIngredientText('3 dl jauhoja');
        
        expect(result1.amount).toBe('2 rkl');
        expect(result1.itemName).toBe('öljyä');
        expect(result2.amount).toBe('1 tl');
        expect(result2.itemName).toBe('suolaa');
        expect(result3.amount).toBe('3 dl');
        expect(result3.itemName).toBe('jauhoja');
      });

      it('should handle complex Finnish ingredient descriptions', () => {
        const result = service.parseIngredientText('1 dl hienonnettua sipulia (tai sipulijauhetta)');
        
        expect(result.amount).toBe('1 dl');
        expect(result.itemName).toBe('sipulia');
        expect(result.metadata?.unnecessaryMetadata).toBe('(tai sipulijauhetta)');
        expect(result.metadata?.preparation).toBe('hienonnettua');
      });

      it('should handle Finnish brand names with unnecessary metadata', () => {
        const result = service.parseIngredientText('1 pkt (200 g) Valio juustoa (tai vastaavaa)');
        
        expect(result.amount).toBe('1 pkt');
        expect(result.metadata?.packageSize).toBe('200 g');
        expect(result.brand).toBe('Valio');
        expect(result.itemName).toBe('juustoa');
        expect(result.metadata?.unnecessaryMetadata).toBe('(tai vastaavaa)');
      });
    });
  });

  describe('parseRecipeIngredients', () => {
    it('should parse multiple ingredients', () => {
      const ingredients = [
        '2-3 (500 g) omena',
        '1 dl Arla Lempi maito',
        '1/2 kg peruna'
      ];

      const results = service.parseRecipeIngredients(ingredients);

      expect(results).toHaveLength(3);
      expect(results[0].amount).toBe('3');
      expect(results[0].itemName).toBe('omena');
      expect(results[1].amount).toBe('1 dl');
      expect(results[1].brand).toBe('Arla');
      expect(results[1].metadata?.subBrand).toBe('Lempi');
      expect(results[2].amount).toBe('1/2 kg');
      expect(results[2].itemName).toBe('peruna');
    });

    it('should filter out empty ingredients', () => {
      const ingredients = [
        '2-3 (500 g) omena',
        '',
        '   ',
        '1 dl maito'
      ];

      const results = service.parseRecipeIngredients(ingredients);

      expect(results).toHaveLength(2);
      expect(results[0].itemName).toBe('omena');
      expect(results[1].itemName).toBe('maito');
    });

    it('should handle empty array', () => {
      const results = service.parseRecipeIngredients([]);
      expect(results).toEqual([]);
    });

    it('should handle non-array input', () => {
      const results = service.parseRecipeIngredients(null as any);
      expect(results).toEqual([]);
    });
  });

  describe('createIngredientFromParsedResult', () => {
    it('should create ingredient from parsed result', () => {
      const parsedResult: IngredientParserResult = {
        amount: '2 dl',
        brand: 'Arla',
        itemName: 'maito',
        category: 'dairy',
        confidence: 0.9,
        rawText: '2 dl Arla maito',
        metadata: {
          subBrand: 'Lempi',
          temperature: 'kylmä'
        }
      };

      mockItemService.filterItems.mockReturnValue([]);

      const ingredient = service.createIngredientFromParsedResult(parsedResult);

      expect(ingredient.amount).toBe('2 dl');
      expect(ingredient.item.itemName).toBe('maito');
      expect(mockItemService.addItem).toHaveBeenCalled();
    });

    it('should reuse existing item if found', () => {
      const existingItem = { id: '1', itemName: 'maito', itemColor: 'blue', usageCount: 1 };
      const parsedResult: IngredientParserResult = {
        amount: '2 dl',
        itemName: 'maito',
        confidence: 0.9,
        rawText: '2 dl maito'
      };

      mockItemService.filterItems.mockReturnValue([existingItem as any]);

      const ingredient = service.createIngredientFromParsedResult(parsedResult);

      expect(ingredient.item).toBe(existingItem);
      expect(mockItemService.incrementUsage).toHaveBeenCalledWith(existingItem);
    });
  });

  describe('parseRecipeToIngredients', () => {
    it('should convert recipe ingredients to Ingredient objects', () => {
      const recipeIngredients = [
        '2-3 (500 g) omena',
        '1 dl Arla Lempi maito'
      ];

      mockItemService.filterItems.mockReturnValue([]);

      const ingredients = service.parseRecipeToIngredients(recipeIngredients);

      expect(ingredients).toHaveLength(2);
      expect(ingredients[0].amount).toBe('3');
      expect(ingredients[0].item.itemName).toBe('omena');
      expect(ingredients[1].amount).toBe('1 dl');
      expect(ingredients[1].item.itemName).toBe('maito');
    });
  });
});
