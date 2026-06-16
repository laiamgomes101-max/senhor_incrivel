import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import userRepository from '../repositories/userRepository.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret';

const validatePassword = (password) => {
  const requirements = {
    length: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password)
  };

  const isValid = Object.values(requirements).every(req => req === true);

  if (!isValid) {
    const missingReqs = [];
    if (!requirements.length) missingReqs.push('mínimo 8 caracteres');
    if (!requirements.hasUpperCase) missingReqs.push('letra maiúscula (A-Z)');
    if (!requirements.hasLowerCase) missingReqs.push('letra minúscula (a-z)');
    if (!requirements.hasNumbers) missingReqs.push('número (0-9)');

    throw new Error(
      `Senha fraca. Incluir: ${missingReqs.join(', ')}`
    );
  }

  return true;
};

class AuthService {
  async register(userData) {
    const { email, password, nome, tipo } = userData;

    validatePassword(password);


    const existingUser = await userRepository.getUserByEmail(email);
    if (existingUser) {
      throw new Error('Email já cadastrado');
    }


    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);


    const user = await userRepository.createUser({
      email,
      password_hash,
      tipo,
      nome
    });


    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        tipo: user.tipo,
        nome: user.nome
      },
      token
    };
  }

  async login(credentials) {
    const { email, password } = credentials;


    const user = await userRepository.getUserByEmail(email);
    if (!user) {
      throw new Error('Email ou senha inválidos');
    }


    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Email ou senha inválidos');
    }


    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        tipo: user.tipo,
        nome: user.nome
      },
      token
    };
  }

  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        tipo: user.tipo
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Token inválido');
    }
  }

  async getCurrentUser(userId) {
    const user = await userRepository.getUserById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    return {
      id: user.id,
      email: user.email,
      tipo: user.tipo,
      nome: user.nome,
      created_at: user.created_at
    };
  }
}

export default new AuthService();