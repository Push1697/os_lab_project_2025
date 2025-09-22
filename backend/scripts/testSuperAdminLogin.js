const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const connectDB = require('../config/db');
require('dotenv').config();

const testSuperAdminLogin = async () => {
  try {
    console.log('🧪 Testing super admin login...');
    
    // Connect to database
    await connectDB();
    
    // Test credentials
    const testEmail = 'superadmin1@gmail.com';
    const testPassword = 'super123';
    
    // Find admin by email
    const admin = await Admin.findOne({ email: testEmail.toLowerCase() });
    
    if (!admin) {
      console.log('❌ Admin not found with email:', testEmail);
      process.exit(1);
    }
    
    console.log('✅ Admin found in database:');
    console.log('   - Email:', admin.email);
    console.log('   - Role:', admin.role);
    console.log('   - Active:', admin.isActive);
    console.log('   - Created:', admin.createdAt);
    
    // Test password comparison
    const isValidPassword = await admin.comparePassword(testPassword);
    
    if (isValidPassword) {
      console.log('✅ Password verification successful!');
      console.log('🎉 Super admin can login with provided credentials');
    } else {
      console.log('❌ Password verification failed!');
      console.log('⚠️  The password does not match');
    }
    
    // Check account status
    if (admin.isLocked) {
      console.log('⚠️  Account is currently locked');
    }
    
    if (!admin.isActive) {
      console.log('⚠️  Account is inactive');
    }
    
    console.log('\n📋 Login test summary:');
    console.log('   - Email found: ✅');
    console.log('   - Password valid:', isValidPassword ? '✅' : '❌');
    console.log('   - Account active:', admin.isActive ? '✅' : '❌');
    console.log('   - Account unlocked:', !admin.isLocked ? '✅' : '❌');
    
    // Close database connection
    await mongoose.connection.close();
    console.log('📴 Database connection closed.');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error testing super admin login:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the test
if (require.main === module) {
  testSuperAdminLogin();
}

module.exports = testSuperAdminLogin;