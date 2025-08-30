import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { RecipePage } from './recipe.page';
import { CloudStoreService } from '../services/cloud-store.service';
import { RecipeServiceService } from '../services/recipe-service.service';
import { Platform, ModalController, LoadingController } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { Recipe } from '../models/recipe';

describe('RecipePage', () => {
  let component: RecipePage;
  let fixture: ComponentFixture<RecipePage>;
  let mockActivatedRoute: any;
  let mockRouter: any;
  let mockCloudStoreService: any;
  let mockRecipeService: any;
  let mockPlatform: any;
  let mockModalController: any;
  let mockLoadingController: any;

  beforeEach(async () => {
    const mockRecipe: Recipe = {
      uuid: 'test-uuid',
      name: 'Test Recipe',
      category: 'test-category',
      description: 'Test description',
      ingredients: [],
      ingredientMap: new Map(),
      imageURI: null
    };

    mockActivatedRoute = {
      params: { subscribe: jest.fn() },
      queryParams: { subscribe: jest.fn() },
      fragment: { subscribe: jest.fn() },
      data: { subscribe: jest.fn() },
      url: { subscribe: jest.fn() },
      outlet: 'primary',
      component: null,
      snapshot: {},
      title: { subscribe: jest.fn() },
      paramMap: { subscribe: jest.fn() },
      queryParamMap: { subscribe: jest.fn() }
    };

    mockRouter = {
      navigate: jest.fn().mockResolvedValue(true)
    };

    mockCloudStoreService = {
      storeRecipeImage: jest.fn(),
      getReferenceToUploadedFile: jest.fn(),
      removeImage: jest.fn()
    };

    mockRecipeService = {
      findUsingUUID: jest.fn().mockReturnValue(mockRecipe),
      updateRecipe: jest.fn()
    };

    mockPlatform = {
      is: jest.fn().mockReturnValue(false)
    };

    mockModalController = {
      create: jest.fn()
    };

    mockLoadingController = {
      create: jest.fn()
    };

    await TestBed.configureTestingModule({
      declarations: [RecipePage],
      imports: [IonicModule.forRoot(), ReactiveFormsModule],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        { provide: CloudStoreService, useValue: mockCloudStoreService },
        { provide: RecipeServiceService, useValue: mockRecipeService },
        { provide: Platform, useValue: mockPlatform },
        { provide: ModalController, useValue: mockModalController },
        { provide: LoadingController, useValue: mockLoadingController }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RecipePage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
