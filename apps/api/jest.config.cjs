module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/unit/**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  // map .js imports in TS sources to their TS counterparts for ts-jest
  moduleNameMapper: {
    '^(.*)\\.js$': '$1',
    '^src/(.*)$': '<rootDir>/src/$1',
  },
};
