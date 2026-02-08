import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    initializeFirestore,
    persistentLocalCache,
    collection,
    doc,
    setDoc,
    onSnapshot,
    query,
    where,
    documentId
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Initialize Firebase (Placeholder - User must replace with their config)
const firebaseConfig = {
    apiKey: "AIzaSyAFSro1X9OFg12NxGjVUX2PzkzThxRRXU0",
    authDomain: "dw-timetracker.web.app",
    projectId: "dw-timetracker",
    storageBucket: "dw-timetracker.appspot.com",
    messagingSenderId: "411877112861"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with persistent cache for offline support
const db = initializeFirestore(app, {
    localCache: persistentLocalCache()
});

// Global State
let logs = {}; // Object to store work logs keyed by YYYY-MM-DD
<<<<<<< HEAD
const HOURLY_WAGE = 13.06; // Default
const TAX_RATE = 0.25;
const STUDENT_LOAN_THRESHOLD_WEEKLY = 27295 / 52;
=======
const HOURLY_WAGE = 15.00; // Default
const TAX_RATE = 0.20;
>>>>>>> aacd488b4f6ebefe522f997aba473a0df07b4375
const STUDENT_LOAN_RATE = 0.09;
// Monthly threshold approx £2274 based on £27295 annual
const MONTHLY_THRESHOLD = 27295 / 12;

document.addEventListener('DOMContentLoaded', () => {
    updateClock();
    setInterval(updateClock, 1000);

    // Setup Real-time Listener instead of one-time load
    setupRealtimeListener();

    // Initialize Calendar (will be updated by listener)
    initCalendar();

    // Event Listeners for Modal
    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    window.onclick = function(event) {
        if (event.target == document.getElementById('entry-modal')) {
            closeModal();
        }
    }

    const entryForm = document.getElementById('entry-form');
    if (entryForm) {
        entryForm.addEventListener('submit', handleFormSubmit);
    }
});

function setupRealtimeListener() {
    const today = new Date();
    // Start Date: 20th of previous month
    // Handle year wrap automatically via Date constructor
    const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 20);
    // End Date: Today (or future if needed, but requirements say 'to today')
    // We'll use today to verify the range.
    const endDate = new Date(today);

    // Formatting for query
    const startStr = formatDate(startDate);
    const endStr = formatDate(endDate);

    console.log(`Listening for logs from ${startStr} to ${endStr}`);

    const q = query(
        collection(db, "work_logs"),
        where(documentId(), ">=", startStr),
        where(documentId(), "<=", endStr)
    );

    onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            const dateStr = change.doc.id;
            if (change.type === "added" || change.type === "modified") {
                logs[dateStr] = change.doc.data();
            }
            if (change.type === "removed") {
                delete logs[dateStr];
            }
        });

        // Update UI
        initCalendar();
        updateDashboard();
    }, (error) => {
        console.error("Error getting documents: ", error);
    });
}

function updateClock() {
    const now = new Date();
    const clock = document.getElementById('clock');
    if (clock) {
        clock.innerText = now.toLocaleTimeString();
    }
}

function initCalendar() {
    const container = document.getElementById('calendar-container');
    if (!container) return;

    container.innerHTML = ''; // Clear existing

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Ghost Week: 7 days before today
    for (let i = 7; i > 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        renderDayCard(date, container, true, false);
    }

    // Today
    renderDayCard(today, container, false, true);

    // Future: 31 days
    for (let i = 1; i <= 31; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        renderDayCard(date, container, false, false);
    }
}

function renderDayCard(date, container, isGhost, isToday) {
    const dateStr = formatDate(date);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = date.getDate();

    const card = document.createElement('div');
    card.className = `calendar-day ${isGhost ? 'ghost' : ''} ${isToday ? 'today' : ''}`;
    card.dataset.date = dateStr;

    // Check if log exists
    const log = logs[dateStr];
    const hours = log ? parseFloat(log.total_hours).toFixed(2) : '--';

    card.innerHTML = `
        <div class="day-date">${dayName} ${dayNum}</div>
        <div class="day-hours">${hours} Hrs</div>
    `;

    card.addEventListener('click', () => openModal(dateStr));
    container.appendChild(card);
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function openModal(dateStr) {
    const modal = document.getElementById('entry-modal');
    const title = document.getElementById('modal-date-title');
    const startInput = document.getElementById('start-time');
    const endInput = document.getElementById('end-time');

    if (modal && title && startInput && endInput) {
        modal.style.display = 'block';
        title.innerText = dateStr;
        title.dataset.date = dateStr;

        // Pre-fill if exists
        if (logs[dateStr]) {
            startInput.value = logs[dateStr].start_time;
            endInput.value = logs[dateStr].end_time;
        } else {
            startInput.value = '';
            endInput.value = '';
        }
    }
}

function closeModal() {
    const modal = document.getElementById('entry-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const dateStr = document.getElementById('modal-date-title').dataset.date;
    const startTime = document.getElementById('start-time').value;
    const endTime = document.getElementById('end-time').value;

    if (startTime && endTime) {
        const totalHours = calculateHours(startTime, endTime);
        const logData = {
            start_time: startTime,
            end_time: endTime,
            total_hours: totalHours
        };

        // Save to Firestore - Persistence is automatic via persistentLocalCache
        try {
            await setDoc(doc(db, "work_logs", dateStr), logData);
            closeModal();
            // No need to manually update UI or logs, onSnapshot will handle it
        } catch (error) {
            console.error("Error saving log: ", error);
            alert("Failed to save log. check console.");
        }
    }
}

function calculateHours(start, end) {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    const startDate = new Date(0, 0, 0, startH, startM);
    const endDate = new Date(0, 0, 0, endH, endM);

    let diff = (endDate - startDate) / (1000 * 60 * 60); // Hours
    if (diff < 0) diff += 24; // Handle overnight

    return diff;
}

function updateDashboard() {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let cycleStartDate;

    // Determine Pay Cycle Start Date
    if (currentDay >= 20) {
        cycleStartDate = new Date(currentYear, currentMonth, 20);
    } else {
        cycleStartDate = new Date(currentYear, currentMonth - 1, 20);
    }

    let totalHours = 0;

    // We iterate through available logs to sum hours for the cycle
    // The logs object contains data from the listener (20th prev month -> today)
    // This should cover the current cycle range completely.

    for (const [dateStr, log] of Object.entries(logs)) {
        const logDate = new Date(dateStr);
        logDate.setHours(0, 0, 0, 0);

        const cycleStart = new Date(cycleStartDate);
        cycleStart.setHours(0, 0, 0, 0);

        const todayDate = new Date(today);
        todayDate.setHours(0, 0, 0, 0);

        if (logDate >= cycleStart && logDate <= todayDate) {
            totalHours += parseFloat(log.total_hours);
        }
    }

    // Calculations
    const grossPay = totalHours * HOURLY_WAGE;
    const tax = grossPay * TAX_RATE;

    let studentLoan = 0;
    if (grossPay > MONTHLY_THRESHOLD) {
        studentLoan = (grossPay - MONTHLY_THRESHOLD) * STUDENT_LOAN_RATE;
    }

    const netPay = grossPay - tax - studentLoan;

    // Update DOM
    const fmt = (val) => `£${val.toFixed(2)}`;

    if (document.getElementById('gross-pay'))
        document.getElementById('gross-pay').innerText = fmt(grossPay);

    if (document.getElementById('tax-deduction'))
        document.getElementById('tax-deduction').innerText = fmt(tax);

    if (document.getElementById('student-loan-deduction'))
        document.getElementById('student-loan-deduction').innerText = fmt(studentLoan);

    if (document.getElementById('net-pay'))
        document.getElementById('net-pay').innerText = fmt(netPay);

    // Update Charts
    const chartData = [];
    let loopDate = new Date(cycleStartDate);
    const todayDate = new Date(today);
    todayDate.setHours(0,0,0,0);

    while (loopDate <= todayDate) {
        const dStr = formatDate(loopDate);
        const log = logs[dStr];
        chartData.push({
            date: dStr,
            day: loopDate.getDate(),
            hours: log ? parseFloat(log.total_hours) : 0
        });
        loopDate.setDate(loopDate.getDate() + 1);
    }

    // Calculate Pay Cycle Progress
    const cycleEndDate = new Date(cycleStartDate);
    cycleEndDate.setMonth(cycleEndDate.getMonth() + 1);
    cycleEndDate.setDate(19);

    const totalCycleDays = (cycleEndDate - cycleStartDate) / (1000 * 60 * 60 * 24) + 1;
    const daysElapsed = (today - cycleStartDate) / (1000 * 60 * 60 * 24) + 1;
    const progress = Math.min(1, Math.max(0, daysElapsed / totalCycleDays));

    if (typeof d3 !== 'undefined') {
        updateCharts(chartData, progress);
    }
}

function updateCharts(data, progress) {
    drawEarningsChart(data);
    drawPayCycleGauge(progress);
}

function drawEarningsChart(data) {
    const container = d3.select("#earnings-chart");
    if (container.empty()) return;

    container.selectAll("*").remove();

    const width = 350;
    const height = 150;
    const margin = { top: 10, right: 10, bottom: 20, left: 30 };

    const svg = container.append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const x = d3.scaleBand()
        .domain(data.map(d => d.day))
        .range([0, innerWidth])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.hours) || 12])
        .range([innerHeight, 0]);

    // Bars
    svg.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.day))
        .attr("y", d => y(d.hours))
        .attr("width", x.bandwidth())
        .attr("height", d => innerHeight - y(d.hours))
        .attr("fill", "#18ff62")
        .style("shape-rendering", "crispEdges");

    // Axes
    svg.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x).tickValues(x.domain().filter((d, i) => !(i % 5))))
        .attr("color", "#18ff62")
        .style("font-family", "VT323");

    svg.append("g")
        .call(d3.axisLeft(y).ticks(5))
        .attr("color", "#18ff62")
        .style("font-family", "VT323");
}

function drawPayCycleGauge(progress) {
    const container = d3.select("#pay-cycle-gauge");
    if (container.empty()) return;

    container.selectAll("*").remove();

    const width = 150;
    const height = 150;
    const radius = Math.min(width, height) / 2;

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2},${height / 2})`);

    const arc = d3.arc()
        .innerRadius(radius * 0.6)
        .outerRadius(radius * 0.9)
        .startAngle(0);

    // Background Arc
    svg.append("path")
        .datum({ endAngle: 2 * Math.PI })
        .style("fill", "#051a05")
        .attr("d", arc);

    // Foreground Arc
    svg.append("path")
        .datum({ endAngle: progress * 2 * Math.PI })
        .style("fill", "#18ff62")
        .attr("d", arc);

    // Text
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .style("fill", "#18ff62")
        .style("font-family", "VT323")
        .style("font-size", "1.5rem")
        .text(`${Math.round(progress * 100)}%`);
}
