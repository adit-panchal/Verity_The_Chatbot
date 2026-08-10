const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({}).select('+password').lean();
    console.log('USER_COUNT', users.length);
    for (const user of users) {
      console.log('USER', user.email, 'passwordField=', user.password);
      const isBcrypt = typeof user.password === 'string' && user.password.startsWith('$2');
      console.log('IS_BCRYPT', isBcrypt);
      if (user.password) {
        console.log('COMPARE', await bcrypt.compare('test123456', user.password));
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
})();
