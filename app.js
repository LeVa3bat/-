// === Константы ===
const CHARGES = [
  "Взрыватель РТМ2",
  "Полный",
  "Уменьшенный",
  "Full charge (Иран)"
];

const SHELLS = [
  "РУС (ОФ-56)",
  "КИМ (ОФ)",
  "ИРАН (ОФ)",
  "ДБ (ОФ)",
  "ДЫМ (Д4)",
  "ТРОТИЛ",
  "СВЕТ [С-4]",
  "ШРАПНЕЛЬ [ЗШ1]"
];

const APP_VERSION = "1.0.0";

// Сокращенные названия для мобильных
const SHORT_NAMES = {
  "Взрыватель РТМ2": "Взрыв. РТМ2",
  "Full charge (Иран)": "Full (Иран)",
  "РУС (ОФ-56)": "РУС ОФ-56",
  "КИМ (ОФ)": "КИМ ОФ",
  "ИРАН (ОФ)": "ИРАН ОФ",
  "ДБ (ОФ)": "ДБ ОФ",
  "ДЫМ (Д4)": "ДЫМ Д4",
  "СВЕТ [С-4]": "СВЕТ С-4",
  "ШРАПНЕЛЬ [ЗШ1]": "ШРАПНЕЛЬ"
};

// === Данные ===
let ammoData = JSON.parse(localStorage.getItem("ammoData")) || {};
let operationsHistory = JSON.parse(localStorage.getItem("operationsHistory")) || [];
let currentTheme = localStorage.getItem("theme") || "light";

// === Инициализация ===
document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
  setupEventListeners();
  applyTheme(currentTheme);
  updateMainPage();
  renderOperationsHistory();
  updateReportDate();
});

function initializeApp() {
  // Инициализация вкладок
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => activateTab(tab.dataset.tab));
  });

  // Инициализация данных
  if (Object.keys(ammoData).length === 0) {
    initializeAmmoData();
  }

  // Инициализация модального окна
  initializeModal();
}

function initializeAmmoData() {
  [...CHARGES, ...SHELLS].forEach(item => {
    ammoData[item] = { initial: 0, income: 0, outcome: 0, final: 0 };
  });
  saveData();
}

function initializeModal() {
  const modal = document.getElementById("settingsModal");
  const settingsBtn = document.getElementById("settingsBtn");
  const closeBtn = document.getElementById("closeModal");
  const themeBtns = document.querySelectorAll(".theme-btn");
  const exportBtn = document.getElementById("exportDataSettings");
  const importBtn = document.getElementById("importDataSettings");

  settingsBtn.addEventListener("click", () => {
    modal.style.display = "block";
  });

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

  themeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const theme = btn.dataset.theme;
      applyTheme(theme);
      themeBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  exportBtn.addEventListener("click", () => {
    exportData();
    modal.style.display = "none";
  });

  importBtn.addEventListener("click", () => {
    document.getElementById("importFile").click();
    modal.style.display = "none";
  });

  // Установка активной темы в модальном окне
  themeBtns.forEach(btn => {
    if (btn.dataset.theme === currentTheme) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

function applyTheme(theme) {
  currentTheme = theme;
  localStorage.setItem("theme", theme);
  
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    document.querySelector('meta[name="theme-color"]').setAttribute("content", "#2d3a1f");
  } else {
    document.documentElement.removeAttribute("data-theme");
    document.querySelector('meta[name="theme-color"]').setAttribute("content", "#556b2f");
  }
}

function setupEventListeners() {
  // Операции
  document.getElementById("itemIncome").addEventListener("click", () => applyOperation("in"));
  document.getElementById("itemOutcome").addEventListener("click", () => applyOperation("out"));
  document.getElementById("categorySelect").addEventListener("change", updateItemSelect);

  // Отчёты
  document.getElementById("generateReport").addEventListener("click", generateReport);
  document.getElementById("printReport").addEventListener("click", printReport);
  document.getElementById("resetData").addEventListener("click", resetData);
  document.getElementById("importFile").addEventListener("change", importData);
}

function activateTab(tabName) {
  document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));

  const tabElement = document.querySelector(`.tab[data-tab="${tabName}"]`);
  const contentElement = document.getElementById(tabName);

  if (tabElement && contentElement) {
    tabElement.classList.add("active");
    contentElement.classList.add("active");
  }
}

function updateItemSelect() {
  const category = document.getElementById("categorySelect").value;
  const itemSelect = document.getElementById("itemSelect");
  
  itemSelect.innerHTML = '<option value="">-- Выберите --</option>';
  
  if (category === "charge") {
    CHARGES.forEach(charge => {
      itemSelect.innerHTML += `<option value="${charge}">${getShortName(charge)}</option>`;
    });
  } else if (category === "shell") {
    SHELLS.forEach(shell => {
      itemSelect.innerHTML += `<option value="${shell}">${getShortName(shell)}</option>`;
    });
  }
}

function getShortName(fullName) {
  return SHORT_NAMES[fullName] || fullName;
}

function applyOperation(operation) {
  const category = document.getElementById("categorySelect").value;
  const item = document.getElementById("itemSelect").value;
  const quantity = parseInt(document.getElementById("itemQuantity").value) || 0;
  const notes = document.getElementById("itemNotes").value;
  
  if (!category || !item || quantity <= 0) {
    showToast("❌ Заполните все поля");
    return;
  }
  
  if (operation === "in") {
    ammoData[item].income += quantity;
  } else {
    if (ammoData[item].final < quantity) {
      showToast("❌ Недостаточно");
      return;
    }
    ammoData[item].outcome += quantity;
  }
  
  ammoData[item].final = ammoData[item].initial + ammoData[item].income - ammoData[item].outcome;
  
  operationsHistory.push({
    date: new Date().toISOString(),
    type: category,
    operation: operation,
    name: item,
    quantity: quantity,
    notes: notes
  });
  
  saveData();
  updateMainPage();
  renderOperationsHistory();
  
  document.getElementById("itemQuantity").value = "1";
  document.getElementById("itemNotes").value = "";
  
  showToast(operation === "in" ? "✅ Приход" : "✅ Расход");
}

// === Основная таблица ===
function updateMainPage() {
  const tbody = document.querySelector("#summaryTable tbody");
  tbody.innerHTML = "";

  const renderBlock = (items, title) => {
    const header = document.createElement("tr");
    header.className = "category-header";
    header.innerHTML = `<td colspan="5">${title}</td>`;
    tbody.appendChild(header);

    items.forEach(name => {
      const d = ammoData[name];
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="col-name" title="${name}">${getShortName(name)}</td>
        <td class="col-initial"><input type="number" class="editable-cell" data-name="${name}" value="${d.initial}" min="0"></td>
        <td class="col-income income-positive">${d.income}</td>
        <td class="col-outcome outcome-negative">${d.outcome}</td>
        <td class="col-final">${d.final}</td>
      `;
      tbody.appendChild(row);
    });

    const total = calculateTotal(items);
    const totalRow = document.createElement("tr");
    totalRow.className = "total-row";
    totalRow.innerHTML = `
      <td class="col-name">Итого</td>
      <td class="col-initial">${total.initial}</td>
      <td class="col-income income-positive">${total.income}</td>
      <td class="col-outcome outcome-negative">${total.outcome}</td>
      <td class="col-final">${total.final}</td>
    `;
    tbody.appendChild(totalRow);
  };

  renderBlock(CHARGES, "ЗАРЯДЫ");
  renderBlock(SHELLS, "СНАРЯДЫ");

  document.querySelectorAll(".editable-cell").forEach(input => {
    input.addEventListener("change", function() {
      const name = this.dataset.name;
      const value = parseInt(this.value) || 0;
      ammoData[name].initial = value;
      ammoData[name].final = ammoData[name].initial + ammoData[name].income - ammoData[name].outcome;
      saveData();
      updateMainPage();
    });
  });
}

function calculateTotal(items) {
  return items.reduce((total, item) => {
    const data = ammoData[item] || { initial: 0, income: 0, outcome: 0, final: 0 };
    total.initial += data.initial;
    total.income += data.income;
    total.outcome += data.outcome;
    total.final += data.final;
    return total;
  }, { initial: 0, income: 0, outcome: 0, final: 0 });
}

// === История операций ===
function renderOperationsHistory() {
  const operationsBody = document.querySelector("#operationsTable tbody");
  operationsBody.innerHTML = "";

  operationsHistory.slice(-15).reverse().forEach(op => {
    const row = document.createElement("tr");
    const date = new Date(op.date);
    const shortDate = date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
    const operationClass = op.operation === "in" ? "income-positive" : "outcome-negative";
    const operationText = op.operation === "in" ? "Прих" : "Расх";
    const categoryText = op.type === "charge" ? "Зар" : "Снр";
    const notes = op.notes && op.notes.length > 6 ? op.notes.slice(0, 6) + "…" : (op.notes || "-");

    row.innerHTML = `
      <td>${shortDate}</td>
      <td>${categoryText}</td>
      <td class="${operationClass}">${operationText}</td>
      <td title="${op.name}">${truncateText(getShortName(op.name), 12)}</td>
      <td class="${operationClass}">${op.quantity}</td>
      <td>${notes}</td>
    `;
    operationsBody.appendChild(row);
  });
}

function truncateText(text, maxLength) {
  return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
}

// === Сохранение данных ===
function saveData() {
  localStorage.setItem("ammoData", JSON.stringify(ammoData));
  localStorage.setItem("operationsHistory", JSON.stringify(operationsHistory));
}

// === Отчёты ===
function generateReport() {
  showToast("✅ Отчет обновлен");
}

function printReport() {
  const printWindow = window.open('', '_blank');
  const now = new Date().toLocaleDateString('ru-RU');
  
  let reportHTML = `
    <html>
      <head>
        <title>Отчет 2С1 Гвоздика - ${now}</title>
        <style>
          body { font-family: Arial; margin: 10px; font-size: 12px; }
          h1 { text-align: center; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #000; padding: 6px; text-align: center; }
          th { background-color: #f0f0f0; }
          .category-header { background: #556b2f; color: white; text-align: left; font-weight: bold; }
          .total-row { background-color: #f0f0f0; font-weight: bold; }
          @media print { body { margin: 5px; } }
        </style>
      </head>
      <body>
        <h1>Отчет 2С1 "Гвоздика"</h1>
        <div>На дату: ${now}</div>
        <div>Версия приложения: ${APP_VERSION}</div>
        <br>
        <table>
          <thead>
            <tr>
              <th>Наименование</th>
              <th>Нач.</th>
              <th>Прих.</th>
              <th>Расх.</th>
              <th>Кон.</th>
            </tr>
          </thead>
          <tbody>
  `;

  // Заряды
  reportHTML += `<tr class="category-header"><td colspan="5">ЗАРЯДЫ</td></tr>`;
  CHARGES.forEach(name => {
    const item = ammoData[name] || { initial: 0, income: 0, outcome: 0, final: 0 };
    reportHTML += `
      <tr>
        <td>${name}</td>
        <td>${item.initial}</td>
        <td>${item.income}</td>
        <td>${item.outcome}</td>
        <td>${item.final}</td>
      </tr>
    `;
  });

  const chargesTotal = calculateTotal(CHARGES);
  reportHTML += `
    <tr class="total-row">
      <td>Итого заряды</td>
      <td>${chargesTotal.initial}</td>
      <td>${chargesTotal.income}</td>
      <td>${chargesTotal.outcome}</td>
      <td>${chargesTotal.final}</td>
    </tr>
  `;

  // Снаряды
  reportHTML += `<tr class="category-header"><td colspan="5">СНАРЯДЫ</td></tr>`;
  SHELLS.forEach(name => {
    const item = ammoData[name] || { initial: 0, income: 0, outcome: 0, final: 0 };
    reportHTML += `
      <tr>
        <td>${name}</td>
        <td>${item.initial}</td>
        <td>${item.income}</td>
      <td>${item.outcome}</td>
        <td>${item.final}</td>
      </tr>
    `;
  });

  const shellsTotal = calculateTotal(SHELLS);
  reportHTML += `
    <tr class="total-row">
      <td>Итого снаряды</td>
      <td>${shellsTotal.initial}</td>
      <td>${shellsTotal.income}</td>
      <td>${shellsTotal.outcome}</td>
      <td>${shellsTotal.final}</td>
    </tr>
  `;

  reportHTML += `
          </tbody>
        </table>
        <br>
        <div>Всего боеприпасов: ${chargesTotal.final + shellsTotal.final}</div>
        <script>window.print();</script>
      </body>
    </html>
  `;
  
  printWindow.document.write(reportHTML);
  printWindow.document.close();
}

function updateReportDate() {
  const now = new Date();
  document.getElementById("reportDate").textContent = now.toLocaleDateString("ru-RU");
}

// === Экспорт/Импорт данных ===
function exportData() {
  const dataStr = JSON.stringify({ 
    ammoData, 
    operationsHistory,
    exportDate: new Date().toISOString(),
    version: APP_VERSION
  }, null, 2);
  
  const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
  const fileName = `гвоздика_${new Date().toISOString().slice(0,10)}.json`;
  
  const link = document.createElement("a");
  link.setAttribute("href", dataUri);
  link.setAttribute("download", fileName);
  link.click();
  
  showToast("✅ Экспорт");
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.ammoData && data.operationsHistory) {
        ammoData = data.ammoData;
        operationsHistory = data.operationsHistory;
        
        saveData();
        updateMainPage();
        renderOperationsHistory();
        
        showToast("✅ Импорт");
      } else {
        showToast("❌ Ошибка файла");
      }
    } catch {
      showToast("❌ Ошибка чтения");
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function resetData() {
  if (confirm("Сбросить все данные?")) {
    localStorage.clear();
    ammoData = {};
    operationsHistory = [];
    
    initializeAmmoData();
    renderOperationsHistory();
    
    showToast("✅ Сброс");
  }
}

// === Утилиты ===
function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease";
  }, 2000);
  
  setTimeout(() => {
    toast.remove();
  }, 2300);
}

// === Service Worker ===
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js")
    .then(registration => {
      console.log("SW registered");
    })
    .catch(error => {
      console.log("SW error:", error);
    });
}
