// MongoDB initialization script
// Creates a non-root user for the application

db = db.getSiblingDB('wdp');

db.createUser({
  user: 'wdp_user',
  pwd: 'wdp_password',
  roles: [
    {
      role: 'readWrite',
      db: 'wdp'
    }
  ]
});

print('MongoDB initialized: wdp database and wdp_user created');
