import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RecipesPage } from './recipes.page';
import { RecipeServiceService } from '../services/recipe-service.service';
import { ActivatedRoute, Router } from '@angular/router';
import { PopoverController } from '@ionic/angular';
import { CloudStoreService } from '../services/cloud-store.service';
import { EventEmitter } from '@angular/core';

describe('RecipesPage', () => {
  let component: RecipesPage;
  let fixture: ComponentFixture<RecipesPage>;
  let mockRecipeService: any;
  let mockActivatedRoute: any;
  let mockRouter: any;
  let mockPopoverController: any;
  let mockCloudStoreService: any;

  beforeEach(async () => {
    const recipeEvent = new EventEmitter<any[]>();

    mockRecipeService = {
      getItems: jest.fn().mockReturnValue([]),
      addItem: jest.fn(),
      removeItem: jest.fn(),
      updateItem: jest.fn(),
      filterUsingCategory: jest.fn(),
      recipeEvent: recipeEvent
    };

    mockActivatedRoute = {
      params: {
        subscribe: jest.fn()
      }
    };

    mockRouter = {
      navigate: jest.fn().mockResolvedValue(true)
    };

    mockPopoverController = {
      create: jest.fn()
    };

    mockCloudStoreService = {
      storeRecipeImage: jest.fn(),
      getReferenceToUploadedFile: jest.fn(),
      removeImage: jest.fn()
    };

    await TestBed.configureTestingModule({
      declarations: [RecipesPage],
      imports: [IonicModule.forRoot(), HttpClientTestingModule],
      providers: [
        { provide: RecipeServiceService, useValue: mockRecipeService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: mockRouter },
        { provide: PopoverController, useValue: mockPopoverController },
        { provide: CloudStoreService, useValue: mockCloudStoreService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RecipesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
