const MONTHS = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
const today = new Date();
let viewYear = today.getFullYear();
let viewMonth = today.getMonth();
let selectedDate = null;
let events = JSON.parse(localStorage.getItem('dogCalEvents') || '{}');

function saveEvents() {
    localStorage.setItem('dogCalEvents', JSON.stringify(events));
}

function dateKey(y, m, d) {
    return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

function renderCalendar() {
    document.getElementById('month-title').textContent = `${MONTHS[viewMonth]} ${viewYear}`;
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';

    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate();
    const prevDays = new Date(viewYear, viewMonth, 0).getDate();

    for (let i = firstDay - 1; i >= 0; i--) {
        const d = prevDays - i;
        const cell = makeCell(d, viewYear, viewMonth - 1, true);
        grid.appendChild(cell);
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const cell = makeCell(d, viewYear, viewMonth, false);
        grid.appendChild(cell);
    }

    const total = firstDay + daysInMonth;
    const rows = Math.ceil(total / 7);
    const remaining = rows * 7 - total;
    for (let d = 1; d <= remaining; d++) {
        const cell = makeCell(d, viewYear, viewMonth + 1, true);
        grid.appendChild(cell);
    }
}

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

function selectDate(key, d) {
    selectedDate = key;
    const [y, m] = key.split('-').map(Number);
    const dateObj = new Date(y, m-1, d);
    const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('selected-label').textContent = `📌 ${dateObj.toLocaleDateString('id-ID', opts)}`;
    renderCalendar();
    renderEvents();
}

function renderEvents() {
    const list = document.getElementById('events-list');
    list.innerHTML = '';
    if (!selectedDate || !events[selectedDate] || events[selectedDate].length === 0) {
        list.innerHTML = '<li class="no-events">belum ada jadwal nih~ 🐾</li>';
        return;
    }
    events[selectedDate].forEach((ev, i) => {
        const li = document.createElement('li');
        li.className = 'event-item';
        li.innerHTML = `<span>${ev}</span><button class="del-btn" data-i="${i}">✕</button>`;
        li.querySelector('.del-btn').addEventListener('click', () => deleteEvent(i));
        list.appendChild(li);
    });
}

function addEvent() {
    if (!selectedDate) {
        alert('pilih tanggal dulu ya! 🐾');
        return;
    }
    const input = document.getElementById('event-input');
    const text = input.value.trim();
    if (!text) return;
    if (!events[selectedDate]) events[selectedDate] = [];
    events[selectedDate].push(text);
    saveEvents();
    input.value = '';
    renderCalendar();
    renderEvents();
}

function deleteEvent(i) {
    events[selectedDate].splice(i, 1);
    if (events[selectedDate].length === 0) delete events[selectedDate];
    saveEvents();
    renderCalendar();
    renderEvents();
}

document.getElementById('prev-btn').addEventListener('click', () => {
    viewMonth--;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    renderCalendar();
});

document.getElementById('next-btn').addEventListener('click', () => {
    viewMonth++;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    renderCalendar();
});

document.getElementById('add-btn').addEventListener('click', addEvent);
document.getElementById('event-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') addEvent();
});

// init
viewMonth = 5;
viewYear = 2026;
renderCalendar();