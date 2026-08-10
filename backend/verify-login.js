require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const email = 'verify-login@example.com';
    const password = 'verify123456';

    await User.deleteOne({ email }).catch(() => {});
    const created = await User.create({ name: 'Verify Login', email, password });
    console.log('created_user', !!created);

    const found = await User.findOne({ email }).select('+password');
    const compare = await found.matchPassword(password);
    console.log('model_compare', compare);
    console.log('stored_hash_prefix', found.password.slice(0, 7));

    await mongoose.disconnect();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
