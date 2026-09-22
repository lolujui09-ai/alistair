const CHAT_API = '/api/chat';

/**
 * Mengambil daftar sesi chat milik user
 */
export async function fetchChatSessions(token) {
  if (!token) return [];

  const res = await fetch(`${CHAT_API}/sessions`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to fetch chat sessions');
  }

  return json.data || [];
}

/**
 * Membuat sesi chat baru
 */
export async function createChatSession(title, token) {
  const res = await fetch(`${CHAT_API}/sessions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to create chat session');
  }

  return json.data;
}

/**
 * Mengambil detail pesan dalam 1 sesi chat
 */
export async function fetchSessionDetail(sessionId, token) {
  if (!sessionId || !token) return null;

  const res = await fetch(`${CHAT_API}/sessions/${sessionId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to fetch session messages');
  }

  return json.data;
}

/**
 * Toggle pin sesi chat
 */
export async function togglePinSessionApi(sessionId, token) {
  const res = await fetch(`${CHAT_API}/sessions/${sessionId}/pin`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to toggle pin');
  }

  return json;
}

/**
 * Toggle archive sesi chat
 */
export async function toggleArchiveSessionApi(sessionId, token) {
  const res = await fetch(`${CHAT_API}/sessions/${sessionId}/archive`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to toggle archive');
  }

  return json;
}

/**
 * Mengubah nama/judul sesi chat
 */
export async function renameChatSessionApi(sessionId, title, token) {
  const res = await fetch(`${CHAT_API}/sessions/${sessionId}/rename`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to rename chat session');
  }

  return json.data;
}

/**
 * Menghapus sesi chat
 */
export async function deleteChatSessionApi(sessionId, token) {
  const res = await fetch(`${CHAT_API}/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to delete chat session');
  }

  return json;
}

/**
 * Mengirim pesan ke AI RAG dan menyimpan pesan ke database
 */
export async function sendChatMessageApi({ message, sessionId = null, attachedBook = null, token }) {
  const res = await fetch(`${CHAT_API}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, sessionId, attachedBook }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || 'Failed to send message');
  }

  return json.data; // { sessionId, sessionTitle, userMessage, assistantMessage }
}

/**
 * Mengirim pesan ke AI RAG dengan respon streaming (Server-Sent Events)
 */
export async function sendChatMessageStreamApi({
  message,
  sessionId = null,
  attachedBook = null,
  token,
  onInit,
  onToken,
  onDone,
  onError,
}) {
  const res = await fetch(`${CHAT_API}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      sessionId,
      attachedBook,
      stream: true,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Server error (${res.status})`);
  }

  if (!res.body) {
    throw new Error('ReadableStream tidak didukung di lingkungan ini.');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Sisa baris yang belum utuh disimpan di buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;

        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.slice(6).trim();
          try {
            const data = JSON.parse(jsonStr);
            if (data.type === 'init' && onInit) {
              onInit(data);
            } else if (data.type === 'token' && onToken) {
              onToken(String(data.text ?? ''));
            } else if (data.type === 'done' && onDone) {
              onDone(data);
            } else if (data.type === 'error') {
              if (onError) onError(new Error(data.message));
            }
          } catch (err) {
            console.warn('[Stream] Gagal mem-parse chunk JSON:', err);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

