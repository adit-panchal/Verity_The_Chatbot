const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/User');

test('matchPassword accepts legacy plain-text passwords and rehashes them', async () => {
  const user = new User({
    name: 'Legacy User',
    email: 'legacy@example.com',
    password: 'plain-secret',
  });

  user.save = async function () {
    this.__saved = true;
  };

  const isMatch = await user.matchPassword('plain-secret');

  assert.equal(isMatch, true);
  assert.notEqual(user.password, 'plain-secret');
  assert.match(user.password, /^\$2/);
  assert.equal(user.__saved, true);
});
