// Mock UserStorageService
const UserStorageService = jest.fn().mockImplementation(() => ({
  getUserData: jest.fn(),
  setUserData: jest.fn(),
  clearUserData: jest.fn(),
  isLoggedIn: jest.fn(),
  getUserEmail: jest.fn().mockResolvedValue('test@example.com')
}));

module.exports = {
  UserStorageService
};

