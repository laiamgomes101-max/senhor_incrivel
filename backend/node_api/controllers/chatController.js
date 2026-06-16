import pool from '../database.js';

const usuariosOnline = new Map();

function toInt(value) {
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

async function queryOne(sql, params = []) {
  const result = await pool.query(sql, params);
  return Array.isArray(result.rows) ? result.rows[0] : result.rows[0];
}

async function queryAll(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows || [];
}

async function getVagaById(vagaId) {
  return queryOne('SELECT * FROM vagas WHERE id = ?', [vagaId]);
}

async function getCandidaturaById(candidaturaId) {
  return queryOne('SELECT * FROM candidaturas WHERE id = ?', [candidaturaId]);
}

async function hasCandidatura(candidatoId, vagaId) {
  const candidatura = await queryOne(
    'SELECT id FROM candidaturas WHERE candidato_id = ? AND vaga_id = ? LIMIT 1',
    [candidatoId, vagaId]
  );
  return Boolean(candidatura);
}

async function findRoomByKey(roomKey) {
  return queryOne('SELECT * FROM chat_rooms WHERE room_key = ?', [roomKey]);
}

async function updateRoomTimestamp(roomId) {
  await pool.query('UPDATE chat_rooms SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [roomId]);
}

async function createChatRoom({ roomKey, roomType, candidaturaId, vagaId, empresaId, candidatoId }) {
  const existing = await findRoomByKey(roomKey);
  if (existing) {
    return existing;
  }

  const result = await pool.query(
    `INSERT INTO chat_rooms
      (room_key, room_type, candidatura_id, vaga_id, empresa_id, candidato_id, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [roomKey, roomType, candidaturaId, vagaId, empresaId, candidatoId, 'ativa']
  );

  const id = result.rows?.insertId || result.lastID || result.rows?.lastID;
  const room = await queryOne('SELECT * FROM chat_rooms WHERE id = ?', [id]);

  const insertParticipant = async (userId, role) => {
    const sql = process.env.DB_TYPE === 'mysql'
      ? 'INSERT IGNORE INTO chat_participants (chat_room_id, user_id, role) VALUES (?, ?, ?)'
      : 'INSERT OR IGNORE INTO chat_participants (chat_room_id, user_id, role) VALUES (?, ?, ?)';
    await pool.query(sql, [room.id, userId, role]);
  };

  await insertParticipant(empresaId, 'empresa');
  await insertParticipant(candidatoId, 'candidato');

  return room;
}

async function checkRoomPermission({ empresaId, candidatoId, vagaId, candidaturaId, initiatorType }) {
  if (candidaturaId) {
    const candidatura = await getCandidaturaById(candidaturaId);
    if (!candidatura) return false;
    if (vagaId && Number(candidatura.vaga_id) !== Number(vagaId)) return false;
    if (candidatoId && Number(candidatura.candidato_id) !== Number(candidatoId)) return false;
    if (empresaId) {
      const vaga = await getVagaById(candidatura.vaga_id);
      if (!vaga || Number(vaga.empresa_id) !== Number(empresaId)) return false;
    }
    return true;
  }

  if (vagaId && candidatoId && empresaId) {
    const vaga = await getVagaById(vagaId);
    if (!vaga || Number(vaga.empresa_id) !== Number(empresaId)) return false;
    if (initiatorType === 'empresa') {
      return true;
    }
    return await hasCandidatura(candidatoId, vagaId);
  }

  return false;
}

export async function createRoom(req, res) {
  try {
    const { empresaId, candidatoId, vagaId, candidaturaId, initiatorType = 'candidato' } = req.body;

    if (!empresaId || !candidatoId) {
      return res.status(400).json({ status: 'error', message: 'empresaId e candidatoId s�o obrigat�rios' });
    }

    const hasPermission = await checkRoomPermission({ empresaId, candidatoId, vagaId, candidaturaId, initiatorType });
    if (!hasPermission) {
      return res.status(403).json({ status: 'error', message: 'Permiss�o negada para criar sala de chat' });
    }

    const roomKey = candidaturaId
      ? `candidatura:${candidaturaId}`
      : `vaga:${vagaId}:${empresaId}:${candidatoId}`;

    const roomType = candidaturaId ? 'candidatura' : 'vaga';
    const room = await createChatRoom({ roomKey, roomType, candidaturaId, vagaId, empresaId, candidatoId });

    res.json({ status: 'success', data: room });
  } catch (error) {
    console.error('Erro createRoom:', error);
    res.status(500).json({ status: 'error', message: 'Erro ao criar sala', error: error.message });
  }
}

export async function getRoomsForUser(req, res) {
  try {
    const userId = toInt(req.params.userId || req.query.userId);
    const role = req.params.userId ? req.query.role || 'candidato' : req.query.role;

    if (!userId || !role) {
      return res.status(400).json({ status: 'error', message: 'userId e role s�o obrigat�rios' });
    }

    const field = role === 'empresa' ? 'empresa_id' : 'candidato_id';
    const query = `
      SELECT r.*, v.titulo AS vaga_titulo,
        (SELECT COUNT(*) FROM chat_messages m WHERE m.chat_room_id = r.id AND m.recipient_id = ? AND m.status <> 'read') AS unread_count
      FROM chat_rooms r
      LEFT JOIN vagas v ON v.id = r.vaga_id
      WHERE r.${field} = ?
      ORDER BY r.updated_at DESC
    `;

    const rows = await queryAll(query, [userId, userId]);
    res.json({ status: 'success', data: rows });
  } catch (error) {
    console.error('Erro getRoomsForUser:', error);
    res.status(500).json({ status: 'error', message: 'Erro ao buscar salas do usu�rio', error: error.message });
  }
}

export async function getRoom(req, res) {
  try {
    const roomId = toInt(req.params.roomId);
    if (!roomId) {
      return res.status(400).json({ status: 'error', message: 'roomId � obrigat�rio' });
    }
    const room = await queryOne('SELECT * FROM chat_rooms WHERE id = ?', [roomId]);
    if (!room) {
      return res.status(404).json({ status: 'error', message: 'Sala n�o encontrada' });
    }
    res.json({ status: 'success', data: room });
  } catch (error) {
    console.error('Erro getRoom:', error);
    res.status(500).json({ status: 'error', message: 'Erro ao buscar sala', error: error.message });
  }
}

export async function getMessages(req, res) {
  try {
    const roomId = toInt(req.params.roomId);
    const limit = Math.min(200, Math.max(10, toInt(req.query.limit) || 50));
    const offset = Math.max(0, toInt(req.query.offset) || 0);

    if (!roomId) {
      return res.status(400).json({ status: 'error', message: 'roomId � obrigat�rio' });
    }

    const messages = await queryAll(
      `SELECT m.*, u.nome AS sender_name
       FROM chat_messages m
       LEFT JOIN usuarios u ON u.id = m.sender_id
       WHERE m.chat_room_id = ?
       ORDER BY m.created_at ASC
       LIMIT ? OFFSET ?`,
      [roomId, limit, offset]
    );

    res.json({ status: 'success', data: { roomId, total: messages.length, messages } });
  } catch (error) {
    console.error('Erro getMessages:', error);
    res.status(500).json({ status: 'error', message: 'Erro ao buscar mensagens', error: error.message });
  }
}

export async function saveMessage(roomId, senderId, recipientId, content, messageType = 'text') {
  const result = await pool.query(
    `INSERT INTO chat_messages (chat_room_id, sender_id, recipient_id, content, message_type, status)
     VALUES (?, ?, ?, ?, ?, 'sent')`,
    [roomId, senderId, recipientId, content, messageType]
  );
  const id = result.rows?.insertId || result.lastID || result.rows?.lastID;
  await updateRoomTimestamp(roomId);
  return queryOne('SELECT * FROM chat_messages WHERE id = ?', [id]);
}

export async function sendMessage(req, res) {
  try {
    const roomId = toInt(req.params.roomId);
    const { senderId, recipientId, content, messageType } = req.body;

    if (!roomId || !senderId || !recipientId || !content) {
      return res.status(400).json({ status: 'error', message: 'roomId, senderId, recipientId e content são obrigatórios' });
    }

    const message = await saveMessage(roomId, senderId, recipientId, content, messageType || 'text');
    res.json({ status: 'success', data: message });
  } catch (error) {
    console.error('Erro sendMessage:', error);
    res.status(500).json({ status: 'error', message: 'Erro ao enviar mensagem', error: error.message });
  }
}

export async function markMessagesReadInternal(roomId, userId) {
  const result = await pool.query(
    `UPDATE chat_messages SET status = 'read', read_at = CURRENT_TIMESTAMP
     WHERE chat_room_id = ? AND recipient_id = ? AND status <> 'read'`,
    [roomId, userId]
  );
  return result.rows?.affectedRows || result.rowCount || 0;
}

export async function markMessagesRead(req, res) {
  try {
    const roomId = toInt(req.params.roomId);
    const userId = toInt(req.body.userId);
    if (!roomId || !userId) {
      return res.status(400).json({ status: 'error', message: 'roomId e userId são obrigatórios' });
    }

    const updated = await markMessagesReadInternal(roomId, userId);
    res.json({ status: 'success', data: { updated } });
  } catch (error) {
    console.error('Erro markMessagesRead:', error);
    res.status(500).json({ status: 'error', message: 'Erro ao marcar mensagens como lidas', error: error.message });
  }
}

export async function deleteRoom(req, res) {
  try {
    const roomId = toInt(req.params.roomId);
    if (!roomId) {
      return res.status(400).json({ status: 'error', message: 'roomId � obrigat�rio' });
    }

    await pool.query('DELETE FROM chat_messages WHERE chat_room_id = ?', [roomId]);
    await pool.query('DELETE FROM chat_participants WHERE chat_room_id = ?', [roomId]);
    await pool.query('DELETE FROM chat_rooms WHERE id = ?', [roomId]);

    res.json({ status: 'success', message: 'Sala removida' });
  } catch (error) {
    console.error('Erro deleteRoom:', error);
    res.status(500).json({ status: 'error', message: 'Erro ao apagar sala', error: error.message });
  }
}

export function registerUserOnline(userId, socketId) {
  usuariosOnline.set(userId, { socketId, ultimaAtividade: new Date() });
}

export function removeUserOnline(userId) {
  usuariosOnline.delete(userId);
}

export function getOnlineUsers() {
  return Array.from(usuariosOnline.entries()).map(([userId, info]) => ({ userId, ...info }));
}

export async function statusUsuario(req, res) {
  try {
    const status = getOnlineUsers();
    res.json({ status: 'success', data: status });
  } catch (error) {
    console.error('Erro statusUsuario:', error);
    res.status(500).json({ status: 'error', message: 'Erro ao buscar status de usu�rios', error: error.message });
  }
}
