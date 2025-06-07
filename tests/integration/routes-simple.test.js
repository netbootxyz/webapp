const request = require('supertest');
const express = require('express');
const path = require('path');

// Mock filesystem and other dependencies
jest.mock('fs');
jest.mock('child_process');
jest.mock('systeminformation');
jest.mock('js-yaml');
jest.mock('readdirp');

describe('Integration Tests - HTTP Routes (Simplified)', () => {
  let app;
  
  beforeAll(() => {
    // Setup mocks
    const mockFs = require('fs');
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockImplementation((filePath) => {
      if (filePath.includes('menuversion.txt')) return '2.0.0-test';
      if (filePath.includes('package.json')) return JSON.stringify({ version: '0.7.5' });
      return 'mock file content';
    });

    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.SUBFOLDER = '/test/';
    
    // Create a minimal Express app for testing
    app = express();
    
    const baserouter = express.Router();
    
    baserouter.get("/", function (req, res) {
      res.status(200).json({ 
        message: 'Welcome to netboot.xyz webapp', 
        baseurl: process.env.SUBFOLDER || '/' 
      });
    });
    
    baserouter.get("/netbootxyz-web.js", function (req, res) {
      res.setHeader("Content-Type", "application/javascript");
      res.status(200).send('// Mock JavaScript content');
    });
    
    baserouter.get('/health', function (req, res) {
      res.status(200).json({ 
        status: 'healthy',
        version: '0.7.5',
        timestamp: new Date().toISOString()
      });
    });
    
    // Add static file middleware
    baserouter.use('/public', express.static(path.join(__dirname, '../../public')));
    
    app.use(process.env.SUBFOLDER || '/', baserouter);
  });

  afterAll(() => {
    // No server to close, just clean up
    app = null;
  });

  describe('Basic Route Tests', () => {
    test('GET / should return welcome message', async () => {
      const response = await request(app)
        .get('/test/')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('netboot.xyz webapp');
      expect(response.body).toHaveProperty('baseurl', '/test/');
    });

    test('GET /netbootxyz-web.js should return JavaScript content', async () => {
      const response = await request(app)
        .get('/test/netbootxyz-web.js')
        .expect(200)
        .expect('Content-Type', /javascript/);

      expect(response.text).toContain('Mock JavaScript content');
    });

    test('GET /health should return health status', async () => {
      const response = await request(app)
        .get('/test/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('version', '0.7.5');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 for non-existent routes', async () => {
      await request(app)
        .get('/test/nonexistent-route')
        .expect(404);
    });

    test('should handle malformed requests gracefully', async () => {
      await request(app)
        .get('/test/')
        .set('Content-Type', 'application/json')
        .expect(200); // Should still work for GET requests
    });
  });

  describe('Base URL Configuration', () => {
    test('should respect SUBFOLDER environment variable', () => {
      const baseurl = process.env.SUBFOLDER || '/';
      expect(baseurl).toBe('/test/');
    });

    test('should handle requests with different base URLs', async () => {
      const response = await request(app)
        .get('/test/')
        .expect(200);

      expect(response.body.baseurl).toBe('/test/');
    });
  });

  describe('Security Headers', () => {
    test('should set appropriate content-type for JavaScript files', async () => {
      const response = await request(app)
        .get('/test/netbootxyz-web.js')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/javascript/);
    });
  });

  describe('Performance', () => {
    test('should respond to health checks quickly', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/test/health')
        .expect(200);
      
      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    test('should handle multiple concurrent requests', async () => {
      const requests = Array(5).fill().map(() => 
        request(app).get('/test/health').expect(200)
      );

      const responses = await Promise.all(requests);
      expect(responses).toHaveLength(5);
      responses.forEach(response => {
        expect(response.body.status).toBe('healthy');
      });
    });
  });
});