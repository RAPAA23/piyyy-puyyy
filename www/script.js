import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAKNoVyOwrbe9zmcmTgugFdCfchns6M4Xs",
  authDomain: "piyypuyy-dee99.firebaseapp.com",
  projectId: "piyypuyy-dee99",
  storageBucket: "piyypuyy-dee99.firebasestorage.app",
  messagingSenderId: "3592578609",
  appId: "1:3592578609:web:06b786b023858a4c8a1710"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const colRef = collection(db, "events");

const MONTHS = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];

const today = new Date();
let viewYear = today.getFullYear();
let viewMonth = today.getMonth();
let selectedDate = null;
let events = {};
let isFirstLoad = true;

function dateKey(y, m, d) {
  return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

function renderCalendar() {
  document.getElementById('month-title').textContent = `${MONTHS[viewMonth]} ${viewYear}`;
  const grid = document.getElementById('calendar-grid');
  grid.innerHTML = '';

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    grid.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement('div');
    const key = dateKey(viewYear, viewMonth, d);

    cell.className = 'cal-day';
    cell.textContent = d;

    if (selectedDate === key) cell.classList.add('selected');
    if (events[key]) cell.classList.add('has-event');

    cell.onclick = () => selectDate(key, d);

    grid.appendChild(cell);
  }
}

function selectDate(key, d) {
  selectedDate = key;

  const [y, m] = key.split('-').map(Number);
  const dateObj = new Date(y, m-1, d);

  const label = document.getElementById('selected-label');
  if (label) {
    label.textContent = `📌 ${dateObj.toLocaleDateString('id-ID')}`;
  }

  renderCalendar();
  renderEvents();
}

function renderEvents() {
  const list = document.getElementById('events-list');
  list.innerHTML = '';

  if (!selectedDate || !events[selectedDate]) {
    list.innerHTML = '<li class="no-events">belum ada jadwal 🐾</li>';
    return;
  }

  events[selectedDate].forEach(ev => {
    const li = document.createElement('li');
    li.className = 'event-item';

    li.innerHTML = `
      <div>
        <strong>${ev.name || 'anon'}</strong><br>
        <span>${ev.text}</span>
      </div>
      <button class="del-btn">✕</button>
    `;

    li.querySelector('.del-btn').onclick = () => deleteEvent(ev.id);
    list.appendChild(li);
  });
}

async function addEvent() {
  const name = document.getElementById('name-input').value.trim();
  const text = document.getElementById('event-input').value.trim();

  if (!selectedDate || !name || !text) return;

  try {
    // 1. Simpan ke Firebase Firestore
    await addDoc(colRef, { date: selectedDate, text, name });

    // 2. Munculin Notifikasi (Delay 5 detik sesuai settingan lo)
    scheduleNotification(
      "Jadwal Berhasil Disimpan! 🐾", 
      `Halo ${name}, agenda "${text}" sudah masuk di kalender Kita.`
    );

    // 3. Kosongin Input
    document.getElementById('name-input').value = '';
    document.getElementById('event-input').value = '';
    
  } catch (e) {
    console.error("Error nambah jadwal: ", e);
    alert("Gagal simpan jadwal nih, coba cek koneksi!");
  }
}

  document.getElementById('name-input').value = '';
  document.getElementById('event-input').value = '';

async function deleteEvent(id) {
  await deleteDoc(doc(db, "events", id));
}

// onSnapshot handle semua render — ga perlu manual renderCalendar() di bawah
onSnapshot(colRef, snap => {
  events = {};
  snap.forEach(docSnap => {
    const d = docSnap.data();
    if (!events[d.date]) events[d.date] = [];
    events[d.date].push({ ...d, id: docSnap.id });
  });

  if (isFirstLoad) {
    // set tanggal hari ini pas pertama kali data masuk
    selectedDate = dateKey(today.getFullYear(), today.getMonth(), today.getDate());
    isFirstLoad = false;
  }

  renderCalendar();

  if (selectedDate) {
    const d = parseInt(selectedDate.split('-')[2]);
    selectDate(selectedDate, d);
  }
});

document.getElementById('prev-btn').onclick = () => {
  viewMonth--;
  if (viewMonth < 0) { viewMonth = 11; viewYear--; }
  renderCalendar();
};

document.getElementById('next-btn').onclick = () => {
  viewMonth++;
  if (viewMonth > 11) { viewMonth = 0; viewYear++; }
  renderCalendar();
};

document.getElementById('add-btn').onclick = addEvent;

// render awal sebelum firebase balik biar ga blank dulu
selectedDate = dateKey(today.getFullYear(), today.getMonth(), today.getDate());
renderCalendar();
selectDate(selectedDate, today.getDate());

// Import fungsi notifikasi (kalau lo pake sistem module)
// Tapi biasanya di script.js biasa, kita panggil via global object:
const { LocalNotifications } = Capacitor.Plugins;

// 1. Fungsi buat minta izin (panggil ini pas aplikasi baru buka)
async function requestNotificationPermission() {
    const permission = await LocalNotifications.requestPermissions();
    if (permission.display === 'granted') {
        console.log("Izin notifikasi diberikan!");
    }
}

// 2. Fungsi buat munculin notifikasi
async function scheduleNotification(title, body) {
    await LocalNotifications.schedule({
        notifications: [
            {
                title: title,
                body: body,
                id: 1,
                schedule: { at: new Date(Date.now() + 1000 * 5) }, // Muncul 5 detik lagi
                sound: null,
                attachments: null,
                actionTypeId: "",
                extra: null
            }
        ]
    });
}

// Panggil izinnya pas web load
requestNotificationPermission();