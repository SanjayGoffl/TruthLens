const recent = new Map(); // key -> timestamp (ms)
const DEDUPE_MS = 4000;
export function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}
export function permissionState() {
  if (!notificationsSupported()) return 'unsupported';
  return Notification.permission;
}
export async function enableBrowserNotifications() {
  if (!notificationsSupported()) return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch (err) {
    return 'denied';
  }
}
export function showBrowserNotification({ title, message, link }) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return;
  const now = Date.now();
  for (const [k, t] of recent) {
    if (now - t > DEDUPE_MS) recent.delete(k);
  }
  const text = `${String(title || 'TruthLens AI').slice(0, 80)}|${String(message || '').slice(0, 240)}`;
  if (recent.has(text) && now - recent.get(text) < DEDUPE_MS) return; // duplicate delivery — skip
  recent.set(text, now);
  try {
    const notification = new Notification(String(title || 'TruthLens AI').slice(0, 80), {
      body: String(message || '').slice(0, 240),
      tag: `truthlens-${String(title || 'alert').slice(0, 40)}`
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
      if (link && link.startsWith('/')) window.location.assign(link);
    };
    setTimeout(() => notification.close(), 15000);
  } catch (err) {
    return;
  }
}
