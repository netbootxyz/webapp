// Jest setup file
const fs = require('fs');
const path = require('path');

// Track active timers and intervals for cleanup
const activeTimers = new Set();
const activeIntervals = new Set();

// Override setTimeout to track timers
const originalSetTimeout = global.setTimeout;
global.setTimeout = function(callback, delay, ...args) {
  const timer = originalSetTimeout.call(this, (...cbArgs) => {
    activeTimers.delete(timer);
    callback(...cbArgs);
  }, delay, ...args);
  activeTimers.add(timer);
  return timer;
};

// Override setInterval to track intervals
const originalSetInterval = global.setInterval;
global.setInterval = function(callback, delay, ...args) {
  const interval = originalSetInterval.call(this, callback, delay, ...args);
  activeIntervals.add(interval);
  return interval;
};

// Override clearTimeout
const originalClearTimeout = global.clearTimeout;
global.clearTimeout = function(timer) {
  activeTimers.delete(timer);
  return originalClearTimeout.call(this, timer);
};

// Override clearInterval
const originalClearInterval = global.clearInterval;
global.clearInterval = function(interval) {
  activeIntervals.delete(interval);
  return originalClearInterval.call(this, interval);
};

// Set shorter timeout for tests
jest.setTimeout(5000);

// Setup test environment
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.WEB_APP_PORT = '0';
  
  // Mock console methods to reduce noise in tests
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
  
  // Store originals for cleanup
  global.__originalConsole = {
    log: originalConsoleLog,
    error: originalConsoleError,
    warn: originalConsoleWarn
  };
});

// Clean up after each test
afterEach(async () => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Clear any remaining timers
  activeTimers.forEach(timer => {
    clearTimeout(timer);
  });
  activeTimers.clear();
  
  // Clear any remaining intervals
  activeIntervals.forEach(interval => {
    clearInterval(interval);
  });
  activeIntervals.clear();
  
  // Clear any nock interceptors
  if (typeof require('nock') !== 'undefined') {
    require('nock').cleanAll();
  }
});

// Global cleanup
afterAll(async () => {
  // Restore console methods
  if (global.__originalConsole) {
    console.log = global.__originalConsole.log;
    console.error = global.__originalConsole.error;
    console.warn = global.__originalConsole.warn;
  }
  
  // Final cleanup of timers
  activeTimers.forEach(timer => {
    clearTimeout(timer);
  });
  activeTimers.clear();
  
  activeIntervals.forEach(interval => {
    clearInterval(interval);
  });
  activeIntervals.clear();
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
});

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  // Log the error but don't crash the test process
  if (process.env.NODE_ENV === 'test') {
    console.error('Unhandled Rejection in tests:', reason);
  }
});

// Handle uncaught exceptions in tests
process.on('uncaughtException', (error) => {
  if (process.env.NODE_ENV === 'test') {
    console.error('Uncaught Exception in tests:', error);
  }
});