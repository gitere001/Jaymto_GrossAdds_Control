// State variables
let currentDsr = null;
let dsrs = [];
let entries = [];
let currentUpdateId = null;

// DOM Elements
const initialMessage = document.getElementById("initial-message");
const trackerContent = document.getElementById("tracker-content");
const inputControls = document.getElementById("input-controls");
const entriesList = document.getElementById("entries-list");
const dsrSelect = document.getElementById("dsrSelect");
const newDsrInput = document.getElementById("newDsrInput");
const addDsrButton = document.getElementById("addDsrButton");
const deleteDsrButton = document.getElementById("deleteDsrButton");
const numberInput = document.getElementById("numberInput");
const addsInput = document.getElementById("addsInput");
const addButton = document.getElementById("addButton");
const reportDateElement = document.getElementById("reportDate");
const registeredTotal = document.getElementById("registeredTotal");
const unregisteredTotal = document.getElementById("unregisteredTotal");
const updateModal = document.getElementById("updateModal");
const updateAddsInput = document.getElementById("updateAddsInput");
const dateModal = document.getElementById("dateModal");
const dateInput = document.getElementById("dateInput");
const numberModal = document.getElementById("numberModal");
const updateNumberInput = document.getElementById("updateNumberInput");
const confirmDateButton = document.getElementById("confirmDate");
const cancelDateButton = document.getElementById("cancelDate");
const confirmUpdateButton = document.getElementById("confirmUpdate");
const cancelUpdateButton = document.getElementById("cancelUpdate");
const confirmNumberUpdateButton = document.getElementById("confirmNumberUpdate");
const cancelNumberUpdateButton = document.getElementById("cancelNumberUpdate");

// Event Listeners
dsrSelect.addEventListener("change", handleDsrChange);
addDsrButton.addEventListener("click", handleAddDsr);
deleteDsrButton.addEventListener("click", handleDeleteDsr);
addButton.addEventListener("click", handleAddEntry);
reportDateElement.addEventListener("click", showDateModal);
confirmDateButton.addEventListener("click", updateReportDate);
cancelDateButton.addEventListener("click", () => dateModal.classList.remove("show"));
confirmUpdateButton.addEventListener("click", handleUpdateAdds);
cancelUpdateButton.addEventListener("click", () => updateModal.classList.remove("show"));
confirmNumberUpdateButton.addEventListener("click", handleUpdateNumber);
cancelNumberUpdateButton.addEventListener("click", () => numberModal.classList.remove("show"));

// UI Functions
function updateUIVisibility() {
    if (currentDsr) {
        initialMessage.classList.add("hidden");
        trackerContent.classList.remove("hidden");
        inputControls.classList.remove("hidden");
        deleteDsrButton.classList.remove("hidden");
        loadEntries();
        loadReportDate();
    } else {
        initialMessage.classList.remove("hidden");
        trackerContent.classList.add("hidden");
        inputControls.classList.add("hidden");
        deleteDsrButton.classList.add("hidden");
    }
}

// DSR Functions
async function loadDsrs() {
    try {
        const response = await fetch('/api/dsrs');
        dsrs = await response.json();
        updateDsrSelect();
    } catch (error) {
        console.error("Error loading DSRs:", error);
        dsrs = [];
    }
}

function updateDsrSelect() {
    dsrSelect.innerHTML = '<option value="">Select DSR</option>';
    dsrs.forEach((dsr) => {
        const option = document.createElement("option");
        option.value = dsr._id;
        option.textContent = dsr.name;
        dsrSelect.appendChild(option);
    });
}

async function handleDsrChange() {
    const selectedId = dsrSelect.value;
    currentDsr = dsrs.find((dsr) => dsr._id === selectedId) || null;
    updateUIVisibility();
}

async function handleAddDsr() {
    const name = newDsrInput.value.trim();
    if (!name) return;

    try {
        const response = await fetch('/api/dsrs', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name,
                report_date: new Date().toISOString()
            }),
        });
        const dsr = await response.json();
        dsrs.push(dsr);
        updateDsrSelect();
        newDsrInput.value = "";
    } catch (error) {
        console.error("Error adding DSR:", error);
    }
}

async function handleDeleteDsr() {
    if (!confirm("Are you sure you want to delete this DSR and all associated entries?")) {
        return;
    }

    try {
        await fetch(`/api/dsrs/${currentDsr._id}`, { method: "DELETE" });
        dsrs = dsrs.filter((dsr) => dsr._id !== currentDsr._id);
        currentDsr = null;
        updateDsrSelect();
        updateUIVisibility();
    } catch (error) {
        console.error("Error deleting DSR:", error);
    }
}

// Entry Functions
async function loadEntries() {
    try {
        const response = await fetch(`/api/dsrs/${currentDsr._id}/entries`);
        entries = await response.json();

        const blanksEntry = entries.find((entry) => entry.number === "Blanks");
        if (!blanksEntry) {
            await addBlanksEntry();
        }

        renderEntries();
        updateTotals();
    } catch (error) {
        console.error("Error loading entries:", error);
    }
}

async function addBlanksEntry() {
    try {
        const response = await fetch('/api/entries', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                dsr_id: currentDsr._id,
                number: "Blanks",
                adds: 0,
            }),
        });
        const entry = await response.json();
        entries.push(entry);
    } catch (error) {
        console.error("Error adding blanks entry:", error);
    }
}

function renderEntries() {
    entriesList.innerHTML = "";

    const sortedEntries = [...entries].sort((a, b) => {
        if (a.number === "Blanks") return 1;
        if (b.number === "Blanks") return -1;
        return a.number.localeCompare(b.number);
    });

    sortedEntries.forEach((entry) => {
        const entryElement = document.createElement("div");
        entryElement.className = `entry ${entry.number === "Blanks" ? "entry-blanks" : ""}`;

        const deleteButton = entry.number === "Blanks"
            ? ""
            : `<div class="entry-circle" onclick="deleteEntry('${entry._id}')">×</div>`;

        entryElement.innerHTML = `
            ${deleteButton}
            <div class="entry-text">
                <span class="entry-number" onclick="${entry.number === "Blanks" ? "" : `showNumberModal('${entry._id}', '${entry.number}')`}">
                    ${entry.number}
                </span>
                <span class="entry-adds" onclick="showUpdateModal('${entry._id}', ${entry.adds})">
                    ${entry.adds}
                </span>
            </div>
        `;

        entriesList.appendChild(entryElement);
    });
}

function updateTotals() {
    const registered = entries
        .filter((entry) => entry.number !== "Blanks")
        .reduce((sum, entry) => sum + entry.adds, 0);

    const unregistered = entries.find((entry) => entry.number === "Blanks")?.adds || 0;

    registeredTotal.textContent = registered;
    unregisteredTotal.textContent = unregistered;
}

async function handleAddEntry() {
    const number = numberInput.value.trim();
    const adds = parseInt(addsInput.value);

    if (!number || isNaN(adds)) return;

    try {
        const response = await fetch('/api/entries', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                dsr_id: currentDsr._id,
                number,
                adds,
            }),
        });
        const entry = await response.json();
        entries.push(entry);
        numberInput.value = "";
        addsInput.value = "";
        renderEntries();
        updateTotals();
    } catch (error) {
        console.error("Error adding entry:", error);
    }
}

async function deleteEntry(id) {
    if (!confirm("Are you sure you want to delete this entry?")) {
        return;
    }

    try {
        await fetch(`/api/entries/${id}`, { method: "DELETE" });
        entries = entries.filter((entry) => entry._id !== id);
        renderEntries();
        updateTotals();
    } catch (error) {
        console.error("Error deleting entry:", error);
    }
}

// Modal Functions
function showUpdateModal(id, adds) {
    currentUpdateId = id;
    updateAddsInput.value = adds;
    updateModal.classList.add("show");
}

function showNumberModal(id, number) {
    currentUpdateId = id;
    updateNumberInput.value = number;
    numberModal.classList.add("show");
}

function showDateModal() {
    const currentDate = currentDsr.report_date
        ? new Date(currentDsr.report_date)
        : new Date();

    if (!isNaN(currentDate.getTime())) {
        dateInput.value = currentDate.toISOString().split("T")[0];
    } else {
        dateInput.value = new Date().toISOString().split("T")[0];
    }
    dateModal.classList.add("show");
}

async function handleUpdateAdds() {
    const adds = parseInt(updateAddsInput.value);
    if (isNaN(adds)) return;

    try {
        await fetch(`/api/entries/${currentUpdateId}/adds`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ adds }),
        });

        const entry = entries.find((e) => e._id === currentUpdateId);
        if (entry) {
            entry.adds = adds;
            renderEntries();
            updateTotals();
        }

        updateModal.classList.remove("show");
    } catch (error) {
        console.error("Error updating adds:", error);
    }
}

async function handleUpdateNumber() {
    const number = updateNumberInput.value.trim();
    if (!number) return;

    try {
        await fetch(`/api/entries/${currentUpdateId}/number`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ number }),
        });

        const entry = entries.find((e) => e._id === currentUpdateId);
        if (entry) {
            entry.number = number;
            renderEntries();
        }

        numberModal.classList.remove("show");
    } catch (error) {
        console.error("Error updating number:", error);
    }
}

async function updateReportDate() {
    const newDate = dateInput.value;

    try {
        await fetch(`/api/dsrs/${currentDsr._id}/report-date`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ report_date: newDate }),
        });

        currentDsr.report_date = newDate;
        const date = new Date(newDate);
        reportDateElement.textContent = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });

        dateModal.classList.remove("show");
    } catch (error) {
        console.error("Error updating report date:", error);
    }
}

async function loadReportDate() {
    try {
        if (currentDsr && currentDsr.report_date) {
            const date = new Date(currentDsr.report_date);
            if (!isNaN(date.getTime())) {
                reportDateElement.textContent = date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                });
            }
        }
    } catch (error) {
        console.error("Error loading report date:", error);
    }
}

// Initial load
loadDsrs();