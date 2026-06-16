import * as usuarioModel from '../models/usuarioModel.js';
import pool from '../database.js';
import bcrypt from 'bcrypt';

export async function registrarUsuario(dados) {
  const { nome, email, senha, tipo } = dados;
  if (!email || !senha || !tipo) {
    throw new Error('Campos obrigatórios faltando');
  }
  if (!email.includes('@')) {
    throw new Error('Email inválido');
  }
  const existente = await usuarioModel.buscarPorEmail(email);
  if (existente) {
    throw new Error('Email já cadastrado');
  }
  const hashed = await bcrypt.hash(senha, 10);
  const usuario = await usuarioModel.criarUsuario(email, hashed, tipo);




  return usuario;
}

export async function loginUsuario(email, senha) {
  if (!email || !senha) throw new Error('Email e senha são obrigatórios');
  const user = await usuarioModel.buscarPorEmail(email);
  if (!user) throw new Error('Usuário não encontrado');
  const match = await bcrypt.compare(senha, user.senha);
  if (!match) throw new Error('Senha incorreta');
  return user;
}