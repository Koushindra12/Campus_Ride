const socket = io();

socket.on('connect', () => {
  console.log('✅ Connected to Campus Rides server');
});

socket.on('connected', (data) => {
  console.log('Server:', data.message);
});

socket.on('new_ride_notification', (data) => {
  showToast('🛵', 'New Ride Available!',
    `${data.driver_name}: ${data.start_location} → ${data.destination} | ₹${data.price}`);
});

socket.on('ride_request_alert', (data) => {
  showToast('🔔', 'New Ride Request!',
    `${data.passenger_name} wants to join your ride to ${data.destination}`);
});

socket.on('ride_accept_update', (data) => {
  showToast('✅', 'Ride Accepted!', data.message || 'Your ride request was accepted!');
});

socket.on('ride_reject_update', (data) => {
  showToast('❌', 'Ride Rejected', data.message || 'Your ride request was rejected.');
});

socket.on('ride_started', (data) => {
  showToast('🚀', 'Ride Started!', data.message || 'Have a safe journey!');
});

socket.on('ride_cancelled', (data) => {
  showToast('⚠️', 'Ride Cancelled', data.message || 'Ride has been cancelled.');
});

socket.on('emergency_alert', (data) => {
  const alertDiv = document.createElement('div');
  alertDiv.className = 'fixed inset-0 bg-red-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4';
  alertDiv.innerHTML = `
    <div class="bg-red-900 border-2 border-red-400 rounded-2xl p-8 max-w-sm w-full text-center animate-pulse">
      <div class="text-6xl mb-4">🚨</div>
      <h2 class="text-2xl font-black text-white mb-2">EMERGENCY ALERT</h2>
      <p class="text-red-300 font-semibold">${data.user_name} needs help!</p>
      <p class="text-red-200 text-sm mt-2">Location: ${data.lat?.toFixed(4)}, ${data.lng?.toFixed(4)}</p>
      <button onclick="this.parentElement.parentElement.remove()"
        class="mt-6 w-full py-3 bg-white text-red-900 font-black rounded-xl">Acknowledge</button>
    </div>`;
  document.body.appendChild(alertDiv);
});

function showToast(icon, title, msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  document.getElementById('toast-icon').textContent = icon;
  document.getElementById('toast-title').textContent = title;
  document.getElementById('toast-msg').textContent = msg;
  toast.classList.remove('hidden');
  if (window._toastTimer) clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => toast.classList.add('hidden'), 5000);
}