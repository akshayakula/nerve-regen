const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../index');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('User Data API', () => {
  test('should create new user data', async () => {
    const response = await request(app)
      .post('/api/user-data')
      .send({
        formData: {
          name: 'Test User',
          handDominance: 'Right',
          treatment: 'Yes',
          symptomsDate: '2023-01-01'
        },
        handData: {
          wristAngle: 45,
          landmarks: [[1, 2, 3]]
        }
      });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe('Test User');
  });
}); 