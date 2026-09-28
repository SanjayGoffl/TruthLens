import { io } from 'socket.io-client';
let socket = null;
const listeners = new Map();
function attachAll() {
  if (!socket) return;
  for (const [event, fns] of listeners) {
    for (const fn of fns) socket.on(event, fn);
  }
}
export function connectSocket(token) {
  if (socket && socket.connected) return socket;
  disconnectSocket();
  socket = io({ auth: { token }, transports: ['websocket', 'polling'], reconnectionAttempts: 6 });
  attachAll();
  return socket;
}
export function onSocketEvent(event, fn) {
  let set = listeners.get(event);
  if (!set) {
    set = new Set();
    listeners.set(event, set);
  }
  if (set.has(fn)) return;
  set.add(fn);
  if (socket) socket.on(event, fn);
}
export function offSocketEvent(event, fn) {
  if (!fn) return;
  const set = listeners.get(event);
  if (set) set.delete(fn);
  if (socket) socket.off(event, fn);
}
export function disconnectSocket() {
  if (!socket) return;
  for (const [event, fns] of listeners) {
    for (const fn of fns) socket.off(event, fn);
  }
  listeners.clear();
  socket.disconnect();
  socket = null;
}
