import { TestBed } from '@angular/core/testing';
import { CloudStoreService } from './cloud-store.service';
import { AuthService } from './auth.service';
import { Storage } from '@angular/fire/storage';

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

    mockStorage = {
      ref: jest.fn(),
      uploadBytes: jest.fn(),
      getDownloadURL: jest.fn(),
      deleteObject: jest.fn()
    } as any;

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
});