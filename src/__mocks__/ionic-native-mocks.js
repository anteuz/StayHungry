// Mock Ionic Native modules
const SplashScreen = jest.fn().mockImplementation(() => ({
  hide: jest.fn(),
  show: jest.fn()
}));

const StatusBar = jest.fn().mockImplementation(() => ({
  styleDefault: jest.fn(),
  styleLightContent: jest.fn(),
  backgroundColorByHexString: jest.fn()
}));

module.exports = {
  SplashScreen,
  StatusBar
};

