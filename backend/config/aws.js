const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Initialize S3 client
let s3Client = null;

const initS3 = () => {
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.S3_BUCKET) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    return true;
  }
  return false;
};

const uploadToS3 = async (file, folder = 'certificates') => {
  if (!s3Client) {
    throw new Error('S3 is not configured. Check AWS environment variables.');
  }

  const fileExtension = path.extname(file.originalname);
  const fileName = `${folder}/${crypto.randomUUID()}${fileExtension}`;

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read', // Make files publicly readable
  });

  try {
    await s3Client.send(command);
    const fileUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileName}`;
    return fileUrl;
  } catch (error) {
    throw new Error(`Failed to upload to S3: ${error.message}`);
  }
};

const deleteFromS3 = async (fileUrl) => {
  if (!s3Client) {
    throw new Error('S3 is not configured');
  }

  try {
    // Extract key from URL
    const urlParts = fileUrl.split('/');
    const key = urlParts.slice(3).join('/'); // Remove https://bucket.s3.region.amazonaws.com/

    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    throw new Error(`Failed to delete from S3: ${error.message}`);
  }
};

// Local file storage fallback for development
const saveLocalFile = async (file, folder = 'certificates') => {
  const uploadsDir = path.join(__dirname, '..', 'uploads', folder);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const fileExtension = path.extname(file.originalname);
  const fileName = `${crypto.randomUUID()}${fileExtension}`;
  const filePath = path.join(uploadsDir, fileName);

  // Write file to local storage
  fs.writeFileSync(filePath, file.buffer);

  // Return local URL
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  return `${baseUrl}/uploads/${folder}/${fileName}`;
};

const deleteLocalFile = async (fileUrl) => {
  try {
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const relativePath = fileUrl.replace(baseUrl, '');
    const filePath = path.join(__dirname, '..', relativePath);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    throw new Error(`Failed to delete local file: ${error.message}`);
  }
};

// Main upload function that uses S3 or local storage
const uploadFile = async (file, folder = 'certificates') => {
  if (s3Client) {
    return await uploadToS3(file, folder);
  } else {
    return await saveLocalFile(file, folder);
  }
};

// Main delete function
const deleteFile = async (fileUrl) => {
  if (s3Client && fileUrl.includes('amazonaws.com')) {
    return await deleteFromS3(fileUrl);
  } else {
    return await deleteLocalFile(fileUrl);
  }
};

module.exports = {
  initS3,
  uploadFile,
  deleteFile,
  isS3Configured: () => !!s3Client,
};