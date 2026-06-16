import * as usuarioService from '../services/usuarioService.js';

export async function register(req, res) {
  try {
    const usuario = await usuarioService.registrarUsuario(req.body);
    res.json(usuario);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function login(req, res) {
  try {
    const { email, senha } = req.body;
    const user = await usuarioService.loginUsuario(email, senha);
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}