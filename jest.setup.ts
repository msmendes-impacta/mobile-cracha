// Official in-memory AsyncStorage mock: behaves like the real API inside Jest.
jest.mock('@react-native-async-storage/async-storage', () =>
  // jest.mock factories cannot use ES imports.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
