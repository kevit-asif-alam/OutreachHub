export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost/outreachhub',
  jwt: {
    secret: process.env.JWT_SECRET || 'changeme',
    expiresIn: '1h',
  },
});
