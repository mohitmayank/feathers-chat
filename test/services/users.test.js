const assert = require('assert');
const app = require('../../src/app');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
chai.should();

describe('\'users\' service', () => {
  it('registered the service', () => {
    const service = app.service('users');

    assert.ok(service, 'Registered the service');
  });

  it('creates a user, encrypts password and adds gravatar', async () => {
    const user = await app.service('users').create({
      email: 'test@example.com',
      password: 'secret'
    });

    // Verify Gravatar has been set to what we'd expect
    assert.equal(user.avatar, 'https://s.gravatar.com/avatar/55502f40dc8b7c769880b10874abc9d0?s=60');
    // Makes sure the password got encrypted
    assert.ok(user.password !== 'secret');
  });

  it('removes password for external requests', async () => {
    // Setting `provider` indicates an external request
    const params = { provider: 'rest' };

    const user = await app.service('users').create({
      email: 'test2@example.com',
      password: 'secret'
    }, params);

    // Make sure password has been remove
    assert.ok(!user.password);
  });

  it('should patch user with no-content and no side effects', async () => {
    const params = { provider: 'rest' };
    const user = await app.service('users').create({
      email: 'test3@example.com',
      password: 'secret'
    }, params);

    const auth = await app.service('authentication').create({
      strategy : 'local',
      email: 'test3@example.com',
      password: 'secret'
    }, params);

    const read = await chai
      .request(app)
      .get(`/users/${user._id}`)
      .set('Authorization', `Bearer ${auth.accessToken}`);

    read.should.have.status(200);

    const patch = await chai
      .request(app)
      .patch(`/users/${user._id}`)
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .send({ name : 'Test' });

    patch.should.have.status(204);

    const afterPatchRead = await chai
      .request(app)
      .get(`/users/${user._id}`)
      .set('Authorization', `Bearer ${auth.accessToken}`);

    afterPatchRead.should.have.status(200);
  });
});
