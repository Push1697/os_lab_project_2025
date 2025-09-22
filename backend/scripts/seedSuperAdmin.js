const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const connectDB = require('../config/db');
require('dotenv').config();

const seedSuperAdmin = async () => {
  try {
    console.log('🚀 Starting super admin seeding process...');
    
    // Connect to database
    await connectDB();
    
    // Super admin credentials
    const superAdminData = {
      name: 'Super Administrator',
      email: 'superadmin1@gmail.com',
      passwordHash: 'super123', // Will be hashed by pre-save middleware
      phone: '+1234567890',
      department: 'IT Administration',
      designation: 'System Administrator',
      role: 'superadmin',
      isActive: true
    };
    
    // Check if superadmin already exists
    const existingAdmin = await Admin.findOne({ 
      email: superAdminData.email 
    });
    
    if (existingAdmin) {
      console.log('⚠️  Super admin already exists with email:', superAdminData.email);
      console.log('📋 Existing admin details:');
      console.log('   - Email:', existingAdmin.email);
      console.log('   - Role:', existingAdmin.role);
      console.log('   - Active:', existingAdmin.isActive);
      console.log('   - Created:', existingAdmin.createdAt);
      
      // Ask if user wants to update password
      console.log('\n🔄 Updating admin data...');
      existingAdmin.name = superAdminData.name;
      existingAdmin.phone = superAdminData.phone;
      existingAdmin.department = superAdminData.department;
      existingAdmin.designation = superAdminData.designation;
      existingAdmin.passwordHash = 'super123'; // Will be hashed by pre-save middleware
      await existingAdmin.save();
      console.log('✅ Admin data updated successfully!');
      
    } else {
      // Create new superadmin
      const newSuperAdmin = new Admin(superAdminData);
      await newSuperAdmin.save();
      
      console.log('✅ Super admin created successfully!');
      console.log('📋 Admin details:');
      console.log('   - Email:', newSuperAdmin.email);
      console.log('   - Role:', newSuperAdmin.role);
      console.log('   - Active:', newSuperAdmin.isActive);
      console.log('   - ID:', newSuperAdmin._id);
    }
    
    console.log('\n🎉 Super admin seeding completed!');
    console.log('🔐 Login credentials:');
    console.log('   Email: superadmin1@gmail.com');
    console.log('   Password: super123');
    
    // Close database connection
    await mongoose.connection.close();
    console.log('📴 Database connection closed.');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error seeding super admin:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the seeding
if (require.main === module) {
  seedSuperAdmin();
}

module.exports = seedSuperAdmin;