// Mock Firebase modules
const Auth = jest.fn().mockImplementation(() => ({
  currentUser: null,
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  getIdToken: jest.fn()
}));

const createUserWithEmailAndPassword = jest.fn();
const signInWithEmailAndPassword = jest.fn();
const signOut = jest.fn();
const User = jest.fn().mockImplementation(() => ({
  uid: 'mock-uid',
  getIdToken: jest.fn().mockResolvedValue('mock-token')
}));

const Database = jest.fn().mockImplementation(() => ({
  ref: jest.fn(),
  set: jest.fn(),
  get: jest.fn()
}));

const ref = jest.fn();
const onValue = jest.fn();
const set = jest.fn();
const object = jest.fn();

const Storage = jest.fn().mockImplementation(() => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn()
}));

const uploadBytes = jest.fn();
const getDownloadURL = jest.fn();
const deleteObject = jest.fn();

module.exports = {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
  Database,
  ref,
  onValue,
  set,
  object,
  Storage,
  uploadBytes,
  getDownloadURL,
  deleteObject
};

