import jwt from 'jsonwebtoken';

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTMsImVtYWlsIjoiY2hlY2t1c2VyKzIwMjZAZXhhbXBsZS5jb20iLCJ0aXBvIjoiY2FuZGlkYXRvIiwiaWF0IjoxNzgwNDcwNDM3LCJleHAiOjE3ODEwNzUyMzd9.Hef5En7vkIuLSkB8KjDWu462t64b0OWoiLhxODiMYyQ';
const secret = process.env.JWT_SECRET || 'dev-jwt-secret';

try {
  const payload = jwt.verify(token, secret);
  console.log('VERIFIED PAYLOAD:', payload);
} catch (err) {
  console.error('VERIFY ERROR:', err.message);
}
