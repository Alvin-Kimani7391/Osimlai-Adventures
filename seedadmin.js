const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function seedAdmin() {
  const exists = await User.findOne({
    email: 'alvinkimani685@gmail.com'
  });

  if (exists) {
    console.log('Admin already exists');
    return;
  }

  const hashedPassword = await bcrypt.hash('Kilimanjaro@2026', 12);

  await User.create({
    firstName: 'Admin',
    lastName: 'User',
    email: 'alvinkimani685@gmail.com',
    password: hashedPassword,
    role: 'admin'
  });

  console.log('Admin created');
}

seedAdmin()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });