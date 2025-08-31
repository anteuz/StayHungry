import { TestBed } from '@angular/core/testing';
import { CloudStoreService } from './cloud-store.service';
import { AuthService } from './auth.service';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';

// Mock Firebase Storage functions
jest.mock('@angular/fire/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn()
}));

describe('CloudStoreService', () => {
  let service: CloudStoreService;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockStorage: jest.Mocked<Storage>;

  beforeEach(() => {
    mockAuthService = {
      fireAuth: {} as any,
      isAuthenticated: jest.fn().mockReturnValue(true),
      getUserUID: jest.fn().mockReturnValue('test-user-id'),
      signin: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      getActiveUser: jest.fn(),
      getToken: jest.fn()
    } as any;

    mockStorage = {} as any;

    TestBed.configureTestingModule({
      providers: [
        CloudStoreService,
        { provide: AuthService, useValue: mockAuthService },
        { provide: Storage, useValue: mockStorage }
      ]
    });
    service = TestBed.inject(CloudStoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('storeRecipeImage', () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const recipeUUID = 'test-recipe-uuid';

    beforeEach(() => {
      (ref as jest.Mock).mockReturnValue('mock-ref');
      (uploadBytes as jest.Mock).mockResolvedValue({ ref: 'mock-upload-result' });
    });

    it('should successfully upload a valid recipe image', async () => {
      const result = await service.storeRecipeImage(mockFile, recipeUUID);

      expect(ref).toHaveBeenCalledWith(mockStorage, 'users/test-user-id/recipes/test-recipe-uuid/image');
      expect(uploadBytes).toHaveBeenCalledWith('mock-ref', mockFile, {
        contentType: 'image/jpeg',
        customMetadata: {
          owner: 'test-user-id',
          recipeUUID: 'test-recipe-uuid'
        }
      });
      expect(result).toEqual({ ref: 'mock-upload-result' });
    });

    it('should throw error when user is not authenticated', async () => {
      mockAuthService.isAuthenticated.mockReturnValue(false);

      await expect(service.storeRecipeImage(mockFile, recipeUUID))
        .rejects.toThrow('User must be authenticated to upload images');
    });

    it('should throw error when file is missing', async () => {
      await expect(service.storeRecipeImage(null as any, recipeUUID))
        .rejects.toThrow('File and recipe UUID are required');
    });

    it('should throw error when recipe UUID is missing', async () => {
      await expect(service.storeRecipeImage(mockFile, ''))
        .rejects.toThrow('File and recipe UUID are required');
    });

    it('should throw error for unsupported file type', async () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });

      await expect(service.storeRecipeImage(invalidFile, recipeUUID))
        .rejects.toThrow('Only JPEG, PNG, and WebP images are allowed');
    });

    it('should throw error for file too large', async () => {
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });

      await expect(service.storeRecipeImage(largeFile, recipeUUID))
        .rejects.toThrow('File size must be less than 10MB');
    });

    it('should accept PNG files', async () => {
      const pngFile = new File(['test'], 'test.png', { type: 'image/png' });

      await service.storeRecipeImage(pngFile, recipeUUID);

      expect(uploadBytes).toHaveBeenCalledWith('mock-ref', pngFile, expect.objectContaining({
        contentType: 'image/png'
      }));
    });

    it('should accept WebP files', async () => {
      const webpFile = new File(['test'], 'test.webp', { type: 'image/webp' });

      await service.storeRecipeImage(webpFile, recipeUUID);

      expect(uploadBytes).toHaveBeenCalledWith('mock-ref', webpFile, expect.objectContaining({
        contentType: 'image/webp'
      }));
    });
  });

  describe('getReferenceToUploadedFile', () => {
    const recipeUUID = 'test-recipe-uuid';

    beforeEach(() => {
      (ref as jest.Mock).mockReturnValue('mock-ref');
      (getDownloadURL as jest.Mock).mockResolvedValue('https://example.com/image.jpg');
    });

    it('should successfully get download URL for recipe image', async () => {
      const result = await service.getReferenceToUploadedFile(recipeUUID);

      expect(ref).toHaveBeenCalledWith(mockStorage, 'users/test-user-id/recipes/test-recipe-uuid/image');
      expect(getDownloadURL).toHaveBeenCalledWith('mock-ref');
      expect(result).toBe('https://example.com/image.jpg');
    });

    it('should throw error when user is not authenticated', async () => {
      mockAuthService.isAuthenticated.mockReturnValue(false);

      await expect(service.getReferenceToUploadedFile(recipeUUID))
        .rejects.toThrow('User must be authenticated to access images');
    });

    it('should throw error when recipe UUID is missing', async () => {
      await expect(service.getReferenceToUploadedFile(''))
        .rejects.toThrow('Recipe UUID is required');
    });
  });

  describe('removeImage', () => {
    const recipeUUID = 'test-recipe-uuid';

    beforeEach(() => {
      (ref as jest.Mock).mockReturnValue('mock-ref');
      (deleteObject as jest.Mock).mockResolvedValue(undefined);
    });

    it('should successfully delete recipe image', async () => {
      await service.removeImage(recipeUUID);

      expect(ref).toHaveBeenCalledWith(mockStorage, 'users/test-user-id/recipes/test-recipe-uuid/image');
      expect(deleteObject).toHaveBeenCalledWith('mock-ref');
    });

    it('should throw error when user is not authenticated', async () => {
      mockAuthService.isAuthenticated.mockReturnValue(false);

      await expect(service.removeImage(recipeUUID))
        .rejects.toThrow('User must be authenticated to delete images');
    });

    it('should throw error when recipe UUID is missing', async () => {
      await expect(service.removeImage(''))
        .rejects.toThrow('Recipe UUID is required');
    });
  });

  describe('image processing methods', () => {
    it('should return original URI for resizeImage (placeholder implementation)', () => {
      const testURI = 'https://example.com/image.jpg';
      const result = service.resizeImage(testURI);
      expect(result).toBe(testURI);
    });

    it('should return original URI for createThumbnail (placeholder implementation)', () => {
      const testURI = 'https://example.com/image.jpg';
      const result = service.createThumbnail(testURI);
      expect(result).toBe(testURI);
    });
  });
});