import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🔥 config firebase lu
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

// ================= BASIC =================
const MONTHS = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];

const today = new Date();
let viewYear = today.getFullYear();
let viewMonth = today.getMonth();
let selectedDate = null;
let events = {};

// ================= DATE KEY =================
function dateKey(y, m, d) {
  return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

// ================= RENDER CALENDAR =================
function renderCalendar() {
  document.getElementById('month-title').textContent = `${MONTHS[viewMonth]} ${viewYear}`;
  const grid = document.getElementById('calendar-grid');
  grid.innerHTML = '';

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate();
  const prevDays = new Date(viewYear, viewMonth, 0).getDate();

  for (let i = firstDay - 1; i >= 0; i--) {
    grid.appendChild(makeCell(prevDays - i, viewYear, viewMonth - 1, true));
  }

  for (let d = 1; d <= daysInMonth; d++) {
    grid.appendChild(makeCell(d, viewYear, viewMonth, false));
  }

  const total = firstDay + daysInMonth;
  const rows = Math.ceil(total / 7);
  const remaining = rows * 7 - total;

  for (let d = 1; d <= remaining; d++) {
    grid.appendChild(makeCell(d, viewYear, viewMonth + 1, true));
  }
}

// ================= CELL =================
function makeCell(d, y, m, isOther) {
  let nm = m, ny = y;
  if (nm < 0) { nm = 11; ny--; }
  if (nm > 11) { nm = 0; ny++; }

  const cell = document.createElement('div');
  cell.className = 'cal-day';
  cell.textContent = d;

  if (isOther) cell.classList.add('other-month');

  const isToday = d === today.getDate() && nm === today.getMonth() && ny === today.getFullYear();
  if (isToday && !isOther) cell.classList.add('today');

  const key = dateKey(ny, nm, d);
  if (events[key] && events[key].length > 0) cell.classList.add('has-event');
  if (selectedDate === key) cell.classList.add('selected');

  if (!isOther) {
    cell.addEventListener('click', () => selectDate(key, d));
  }

  return cell;
}

// ================= SELECT DATE =================
function selectDate(key, d) {
  selectedDate = key;

  const [y, m] = key.split('-').map(Number);
  const dateObj = new Date(y, m-1, d);

  document.getElementById('selected-label').textContent =
    `📌 ${dateObj.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}`;

  renderCalendar();
  renderEvents();
}

// ================= RENDER EVENTS =================
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
      <strong>${ev.name}</strong><br>
      <span>${ev.text}</span>
    </div>
    <button class="del-btn">✕</button>
  `;

  li.querySelector('.del-btn').addEventListener('click', () => deleteEvent(ev.id));

  list.appendChild(li);
});
}

// ================= ADD =================
async function addEvent() {
  if (!selectedDate) {
    alert('pilih tanggal dulu ya!');
    return;
  }

  const nameInput = document.getElementById('name-input');
  const eventInput = document.getElementById('event-input');

  const name = nameInput.value.trim();
  const text = eventInput.value.trim();

  if (!name || !text) return;

  await addDoc(colRef, {
    date: selectedDate,
    text: text,
    name: name
  });

  nameInput.value = '';
  eventInput.value = '';
}

// ================= DELETE =================
async function deleteEvent(id) {
  await deleteDoc(doc(db, "events", id));
}

// ================= REALTIME =================
onSnapshot(colRef, (snapshot) => {
  events = {};

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (!events[data.date]) events[data.date] = [];

    events[data.date].push({
      text: data.text,
      id: docSnap.id
    });
  });

  renderCalendar();
  renderEvents();
});

// ================= NAV =================
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
document.getElementById('event-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') addEvent();
});

// ================= INIT =================
selectedDate = dateKey(
  today.getFullYear(),
  today.getMonth(),
  today.getDate()
);

selectDate(selectedDate, today.getDate());
renderCalendar();