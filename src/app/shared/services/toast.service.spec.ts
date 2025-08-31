import { TestBed } from '@angular/core/testing';
import { ToastController } from '@ionic/angular';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;
  let mockToastController: jest.Mocked<ToastController>;

  beforeEach(() => {
    const mockToast = {
      present: jest.fn().mockResolvedValue(undefined)
    };

    mockToastController = {
      create: jest.fn().mockResolvedValue(mockToast)
    } as any;

    TestBed.configureTestingModule({
      providers: [
        ToastService,
        { provide: ToastController, useValue: mockToastController }
      ]
    });

    service = TestBed.inject(ToastService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('show', () => {
    it('should create and present a toast with default options', async () => {
      // Arrange
      const options = { message: 'Test message' };

      // Act
      await service.show(options);

      // Assert
      expect(mockToastController.create).toHaveBeenCalledWith({
        message: 'Test message',
        duration: 2000,
        color: 'primary',
        position: 'top',
        cssClass: 'non-blocking-toast',
        buttons: [
          {
            icon: 'close',
            role: 'cancel',
            side: 'end'
          }
        ]
      });
      const mockToast = await mockToastController.create();
      expect(mockToast.present).toHaveBeenCalled();
    });

    it('should create and present a toast with custom options', async () => {
      // Arrange
      const options = {
        message: 'Custom message',
        color: 'success' as const,
        duration: 5000,
        position: 'bottom' as const,
        cssClass: 'custom-toast'
      };

      // Act
      await service.show(options);

      // Assert
      expect(mockToastController.create).toHaveBeenCalledWith({
        message: 'Custom message',
        duration: 5000,
        color: 'success',
        position: 'bottom',
        cssClass: 'custom-toast',
        buttons: [
          {
            icon: 'close',
            role: 'cancel',
            side: 'end'
          }
        ]
      });
    });

    it('should handle toast creation errors gracefully', async () => {
      // Arrange
      const error = new Error('Toast creation failed');
      mockToastController.create.mockRejectedValue(error);
      const options = { message: 'Test message' };

      // Act & Assert
      await expect(service.show(options)).rejects.toThrow('Toast creation failed');
    });
  });

  describe('showSuccess', () => {
    it('should show success toast with default duration', async () => {
      // Arrange
      const message = 'Success message';

      // Act
      await service.showSuccess(message);

      // Assert
      expect(mockToastController.create).toHaveBeenCalledWith({
        message: 'Success message',
        duration: 2000,
        color: 'success',
        position: 'top',
        cssClass: 'non-blocking-toast',
        buttons: [
          {
            icon: 'close',
            role: 'cancel',
            side: 'end'
          }
        ]
      });
    });

    it('should show success toast with custom duration', async () => {
      // Arrange
      const message = 'Success message';
      const duration = 4000;

      // Act
      await service.showSuccess(message, duration);

      // Assert
      expect(mockToastController.create).toHaveBeenCalledWith({
        message: 'Success message',
        duration: 4000,
        color: 'success',
        position: 'top',
        cssClass: 'non-blocking-toast',
        buttons: [
          {
            icon: 'close',
            role: 'cancel',
            side: 'end'
          }
        ]
      });
    });
  });

  describe('showError', () => {
    it('should show error toast with default duration', async () => {
      // Arrange
      const message = 'Error message';

      // Act
      await service.showError(message);

      // Assert
      expect(mockToastController.create).toHaveBeenCalledWith({
        message: 'Error message',
        duration: 3000,
        color: 'danger',
        position: 'top',
        cssClass: 'non-blocking-toast',
        buttons: [
          {
            icon: 'close',
            role: 'cancel',
            side: 'end'
          }
        ]
      });
    });

    it('should show error toast with custom duration', async () => {
      // Arrange
      const message = 'Error message';
      const duration = 5000;

      // Act
      await service.showError(message, duration);

      // Assert
      expect(mockToastController.create).toHaveBeenCalledWith({
        message: 'Error message',
        duration: 5000,
        color: 'danger',
        position: 'top',
        cssClass: 'non-blocking-toast',
        buttons: [
          {
            icon: 'close',
            role: 'cancel',
            side: 'end'
          }
        ]
      });
    });
  });

  describe('showWarning', () => {
    it('should show warning toast with default duration', async () => {
      // Arrange
      const message = 'Warning message';

      // Act
      await service.showWarning(message);

      // Assert
      expect(mockToastController.create).toHaveBeenCalledWith({
        message: 'Warning message',
        duration: 2500,
        color: 'warning',
        position: 'top',
        cssClass: 'non-blocking-toast',
        buttons: [
          {
            icon: 'close',
            role: 'cancel',
            side: 'end'
          }
        ]
      });
    });
  });

  describe('showInfo', () => {
    it('should show info toast with default duration', async () => {
      // Arrange
      const message = 'Info message';

      // Act
      await service.showInfo(message);

      // Assert
      expect(mockToastController.create).toHaveBeenCalledWith({
        message: 'Info message',
        duration: 2000,
        color: 'primary',
        position: 'top',
        cssClass: 'non-blocking-toast',
        buttons: [
          {
            icon: 'close',
            role: 'cancel',
            side: 'end'
          }
        ]
      });
    });
  });

  describe('showBottom', () => {
    it('should show bottom toast with default options', async () => {
      // Arrange
      const message = 'Bottom message';

      // Act
      await service.showBottom(message);

      // Assert
      expect(mockToastController.create).toHaveBeenCalledWith({
        message: 'Bottom message',
        duration: 1500,
        color: 'primary',
        position: 'bottom',
        cssClass: 'non-blocking-toast',
        buttons: [
          {
            icon: 'close',
            role: 'cancel',
            side: 'end'
          }
        ]
      });
    });

    it('should show bottom toast with custom options', async () => {
      // Arrange
      const message = 'Bottom message';
      const color = 'success';
      const duration = 2000;

      // Act
      await service.showBottom(message, color, duration);

      // Assert
      expect(mockToastController.create).toHaveBeenCalledWith({
        message: 'Bottom message',
        duration: 2000,
        color: 'success',
        position: 'bottom',
        cssClass: 'non-blocking-toast',
        buttons: [
          {
            icon: 'close',
            role: 'cancel',
            side: 'end'
          }
        ]
      });
    });
  });

  describe('non-blocking behavior', () => {
    it('should include close button for user control', async () => {
      // Arrange
      const options = { message: 'Test message' };

      // Act
      await service.show(options);

      // Assert
      const createCall = mockToastController.create.mock.calls[0][0];
      expect(createCall.buttons).toEqual([
        {
          icon: 'close',
          role: 'cancel',
          side: 'end'
        }
      ]);
    });

    it('should use shorter default duration to minimize interference', async () => {
      // Arrange
      const options = { message: 'Test message' };

      // Act
      await service.show(options);

      // Assert
      const createCall = mockToastController.create.mock.calls[0][0];
      expect(createCall.duration).toBe(2000); // Shorter than typical 3000ms
    });

    it('should use non-blocking CSS class', async () => {
      // Arrange
      const options = { message: 'Test message' };

      // Act
      await service.show(options);

      // Assert
      const createCall = mockToastController.create.mock.calls[0][0];
      expect(createCall.cssClass).toBe('non-blocking-toast');
    });
  });
});
