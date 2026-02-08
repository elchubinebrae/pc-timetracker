// Initialize Firebase (Placeholder)
const firebaseConfig = {
    apiKey: "AIzaSyAFSro1X9OFg12NxGjVUX2PzkzThxRRXU0",
    authDomain: "dw-timetracker.web.app",
    projectId: "dw-timetracker",
    storageBucket: "dw-timetracker.appspot.com",
    messagingSenderId: "411877112861"
};

// Mock Firestore Service
const DataStore = {
    collectionName: 'work_logs',

    // Simulate getting all documents
    async getLogs() {
        return new Promise((resolve) => {
            const data = localStorage.getItem(this.collectionName);
            resolve(data ? JSON.parse(data) : {});
        });
    },

    // Simulate saving a document (merge/overwrite)
    async saveLog(dateStr, logData) {
        return new Promise((resolve) => {
            const currentData = JSON.parse(localStorage.getItem(this.collectionName) || '{}');
            currentData[dateStr] = logData;
            localStorage.setItem(this.collectionName, JSON.stringify(currentData));
            resolve();
        });
    }
};

// Global State
let logs = {}; // Object to store work logs keyed by YYYY-MM-DD
const HOURLY_WAGE = 13.06; // Default
const TAX_RATE = 0.25;
const STUDENT_LOAN_THRESHOLD_WEEKLY = 27295 / 52;
const STUDENT_LOAN_RATE = 0.09;

document.addEventListener('DOMContentLoaded', () => {
    updateClock();
    setInterval(updateClock, 1000);

    // Load Data (Mock)
    loadData();

    // Initialize Calendar
    initCalendar();

    // Event Listeners for Modal
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    window.onclick = function(event) {
        if (event.target == document.getElementById('entry-modal')) {
            closeModal();
        }
    }

    document.getElementById('entry-form').addEventListener('submit', handleFormSubmit);
});

function updateClock() {
    const now = new Date();
    document.getElementById('clock').innerText = now.toLocaleTimeString();
}

function initCalendar() {
    const container = document.getElementById('calendar-container');
    container.innerHTML = ''; // Clear existing

    const today = new Date();
    // Reset time part to avoid issues
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
    const hours = log ? log.total_hours.toFixed(2) : '--';

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

async function loadData() {
    logs = await DataStore.getLogs();
    initCalendar();
    updateDashboard();
}

function openModal(dateStr) {
    document.getElementById('entry-modal').style.display = 'block';
    document.getElementById('modal-date-title').innerText = dateStr;
    document.getElementById('modal-date-title').dataset.date = dateStr; // Store date in dataset

    // Pre-fill if exists
    if (logs[dateStr]) {
        document.getElementById('start-time').value = logs[dateStr].start_time;
        document.getElementById('end-time').value = logs[dateStr].end_time;
    } else {
        document.getElementById('start-time').value = '';
        document.getElementById('end-time').value = '';
    }
}

function closeModal() {
    document.getElementById('entry-modal').style.display = 'none';
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

        // Optimistic update
        logs[dateStr] = logData;

        await DataStore.saveLog(dateStr, logData);

        initCalendar();
        updateDashboard();
        closeModal();
    }
}

function calculateHours(start, end) {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    const startDate = new Date(0, 0, 0, startH, startM);
    const endDate = new Date(0, 0, 0, endH, endM);

    let diff = (endDate - startDate) / (1000 * 60 * 60); // Hours
    if (diff < 0) diff += 24; // Handle overnight shifts if needed (though not explicitly requested, good to have)

    return diff;
}

function updateDashboard() {
    console.log("Updating Dashboard stats...");

    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth(); // 0-11
    const currentYear = today.getFullYear();

    let cycleStartDate;

    // Determine Pay Cycle Start Date
    if (currentDay >= 20) {
        // If today is on or after the 20th, cycle starts on the 20th of this month
        cycleStartDate = new Date(currentYear, currentMonth, 20);
    } else {
        // If today is before the 20th, cycle starts on the 20th of the previous month
        // Handle January edge case (month - 1 handles year wrap automatically in Date constructor)
        cycleStartDate = new Date(currentYear, currentMonth - 1, 20);
    }

    // Filter logs within the cycle up to today (inclusive of today)
    // Note: The prompt says "to the current date". I'll interpret this as including today.

    let totalHours = 0;

    // Iterate through all logs
    for (const [dateStr, log] of Object.entries(logs)) {
        const logDate = new Date(dateStr);
        // Reset time for accurate comparison
        logDate.setHours(0, 0, 0, 0);
        cycleStartDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        if (logDate >= cycleStartDate && logDate <= today) {
            totalHours += parseFloat(log.total_hours);
        }
    }

    // Calculations
    const grossPay = totalHours * HOURLY_WAGE;
    const tax = grossPay * TAX_RATE;

    // Student Loan: 9% over weekly threshold * number of weeks?
    // Or just 9% over the prorated threshold for the period?
    // The prompt says "Student Loan (9% over threshold)".
    // Since this is an estimate, I'll use a weekly equivalent logic or annual/52 * weeks.
    // However, exact calculation depends on pay frequency (monthly usually).
    // If monthly, threshold is ~£2274.
    // I'll assume a monthly pay cycle context given the "20th to 20th" structure.
    // Let's use the Monthly Threshold: £27295 / 12 = ~£2274.58
    const MONTHLY_THRESHOLD = 27295 / 12;

    // We are estimating for the *current accumulated amount*.
    // This is tricky. Are we estimating what the deduction *will be* at the end of the month based on *current* hours?
    // Or calculating the deduction applicable to the *current* amount?
    // Usually, tax/NI/Student Loan is calculated on the total pay for the period.
    // If I work 1 hour, I don't pay student loan yet.
    // So I should compare `grossPay` against the threshold (prorated? No, usually distinct pay period).
    // If the dashboard shows "Earned so far", it should probably show the deduction *if paid now*.
    // But since pay is monthly, the threshold applies to the monthly gross.
    // If I'm only halfway through the month, my gross might be below threshold, but will be above by end.
    // Showing 0 deduction might be misleading.
    // However, for "Net Pay: Final estimated take-home", it implies a projection?
    // The prompt says: "Sum total hours worked... to the current date".
    // So it's "Year to Date" style but for the month.
    // I will calculate deductions based on the *current accumulated gross*.

    let studentLoan = 0;
    if (grossPay > MONTHLY_THRESHOLD) {
        studentLoan = (grossPay - MONTHLY_THRESHOLD) * STUDENT_LOAN_RATE;
    }

    const netPay = grossPay - tax - studentLoan;

    // Update DOM
    // Format currency
    const fmt = (val) => `£${val.toFixed(2)}`;

    // I need to update the IDs in index.html
    // Note: I don't have an ID for total hours in the summary, maybe I should add it or just rely on the chart.
    // The prompt asked for specific widgets.

    if (document.getElementById('gross-pay'))
        document.getElementById('gross-pay').innerText = fmt(grossPay);

    if (document.getElementById('tax-deduction'))
        document.getElementById('tax-deduction').innerText = fmt(tax);

    if (document.getElementById('student-loan-deduction'))
        document.getElementById('student-loan-deduction').innerText = fmt(studentLoan);

    if (document.getElementById('net-pay'))
        document.getElementById('net-pay').innerText = fmt(netPay);

    // Also update charts (Step 5)
    // Prepare data for chart: Daily hours in the cycle
    const chartData = [];
    let loopDate = new Date(cycleStartDate);
    while (loopDate <= today) {
        const dStr = formatDate(loopDate);
        const log = logs[dStr];
        chartData.push({
            date: dStr,
            day: loopDate.getDate(),
            hours: log ? parseFloat(log.total_hours) : 0
        });
        loopDate.setDate(loopDate.getDate() + 1);
    }

    // Calculate Pay Cycle Progress (Days)
    // Cycle is approx 30 days. Let's say 20th to 19th.
    // Start: cycleStartDate. End: 19th of next month (relative to cycle start).
    const cycleEndDate = new Date(cycleStartDate);
    cycleEndDate.setMonth(cycleEndDate.getMonth() + 1);
    cycleEndDate.setDate(19);

    const totalCycleDays = (cycleEndDate - cycleStartDate) / (1000 * 60 * 60 * 24) + 1;
    const daysElapsed = (today - cycleStartDate) / (1000 * 60 * 60 * 24) + 1;
    const progress = Math.min(1, Math.max(0, daysElapsed / totalCycleDays));

    updateCharts(chartData, progress);
}

function updateCharts(data, progress) {
    drawEarningsChart(data);
    drawPayCycleGauge(progress);
}

function drawEarningsChart(data) {
    const container = d3.select("#earnings-chart");
    container.selectAll("*").remove(); // Clear previous

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
        .domain([0, d3.max(data, d => d.hours) || 12]) // Default to 12 if no data
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
        .style("shape-rendering", "crispEdges"); // Blocky look

    // Axes
    svg.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x).tickValues(x.domain().filter((d, i) => !(i % 5)))) // Show every 5th label
        .attr("color", "#18ff62")
        .style("font-family", "VT323");

    svg.append("g")
        .call(d3.axisLeft(y).ticks(5))
        .attr("color", "#18ff62")
        .style("font-family", "VT323");
}

function drawPayCycleGauge(progress) {
    const container = d3.select("#pay-cycle-gauge");
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
