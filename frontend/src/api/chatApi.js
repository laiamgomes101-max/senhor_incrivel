import api from './client';

export async function fetchChatRooms(userId, role) {
  return api.get(`/chat?userId=${userId}&role=${role}`);
}

export async function fetchChatRoom(roomId) {
  return api.get(`/chat/${roomId}`);
}

export async function fetchChatMessages(roomId, limit = 100, offset = 0) {
  return api.get(`/chat/${roomId}/messages?limit=${limit}&offset=${offset}`);
}

export async function createChatRoom(payload) {
  return api.post('/chat', payload);
}

export async function sendChatMessage(roomId, payload) {
  return api.post(`/chat/${roomId}/messages`, payload);
}

export async function markChatMessagesRead(roomId, userId) {
  return api.post(`/chat/${roomId}/read`, { userId });
}
