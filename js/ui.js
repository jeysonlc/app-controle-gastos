// Arquivo: js/ui.js
import { categories } from './config.js';

// --- Seletores de Elementos ---
const elements = {
    loadingSpinner: document.getElementById('loading-spinner'),
    authScreen: document.getElementById('auth-screen'),
    loggedInScreen: document.getElementById('logged-in-screen'),
    dashboardContent: document.getElementById('dashboard-content'),
    reportsContent: document.getElementById('reports-content'),
    tabDashboard: document.getElementById('tab-dashboard'),
    tabReports: document.getElementById('tab-reports'),
    userEmail: document.getElementById('user-email'),
    expenseList: document.getElementById('expense-list'),
    noExpensesMessage: document.getElementById('no-expenses-message'),
    noReportsData: document.getElementById('no-reports-data'),
    categorySummaryTbody: document.getElementById('category-summary-tbody'),
    chartCanvas: document.getElementById('category-chart'),
    subcategoryAnalysis: document.getElementById('subcategory-analysis'),
    subcategoryTitle: document.getElementById('subcategory-title'),
    subcategorySummaryTbody: document.getElementById('subcategory-summary-tbody'),
    detailedExpenseListContainer: document.getElementById('detailed-expense-list-container'),
    detailedListTitle: document.getElementById('detailed-list-title'),
    detailedExpenseTbody: document.getElementById('detailed-expense-tbody'),
    startDate: document.getElementById('start-date'),
    endDate: document.getElementById('end-date'),
    startDateDisplay: document.getElementById('start-date-display'),
    endDateDisplay: document.getElementById('end-date-display'),
    categorySelect: document.getElementById('expense-category'),
    subcategorySelect: document.getElementById('expense-subcategory'),
};

let categoryChart = null;

// --- Funções de Renderização ---
export const showLoginScreen = () => {
    elements.loggedInScreen.classList.add('hidden');
    elements.authScreen.classList.remove('hidden');
    elements.loadingSpinner.classList.add('hidden');
};

export const showAppScreen = (user) => {
    elements.authScreen.classList.add('hidden');
    elements.loggedInScreen.classList.remove('hidden');
    elements.userEmail.textContent = `Logado como: ${user.email}`;
    elements.loadingSpinner.classList.add('hidden');
};

export const renderLatestExpenses = (expenses) => {
    elements.expenseList.innerHTML = '';
    if (expenses.length === 0) {
        elements.noExpensesMessage.classList.remove('hidden');
    } else {
        elements.noExpensesMessage.classList.add('hidden');
        expenses.slice(0, 20).forEach(expense => {
            const li = document.createElement('li');
            li.className = "bg-gray-50 p-3 rounded-lg flex justify-between items-start gap-2";
            li.innerHTML = `<div class="flex-grow"><p class="font-semibold text-gray-800">${expense.category} <span class="text-gray-500 font-normal">/ ${expense.subcategory}</span></p><p class="text-sm text-gray-600">${expense.description || 'Sem descrição'}</p><p class="text-xs text-gray-400">${new Date(expense.date + 'T00:00:00').toLocaleDateString('pt-BR')}</p></div><div class="text-right flex-shrink-0"><p class="font-bold text-lg text-red-500">R$ ${expense.amount.toFixed(2).replace('.', ',')}</p></div>`;
            elements.expenseList.appendChild(li);
        });
    }
};

export const updateReportsUI = (sortedCategoryData, onCategoryClick) => {
    elements.subcategoryAnalysis.classList.add('hidden');
    const hasData = sortedCategoryData.length > 0;
    if (!hasData) {
        elements.noReportsData.classList.remove('hidden');
        elements.categorySummaryTbody.innerHTML = '';
        if (categoryChart) categoryChart.destroy();
        categoryChart = null;
        elements.chartCanvas.classList.add('hidden');
        return;
    }
    elements.noReportsData.classList.add('hidden');
    elements.chartCanvas.classList.remove('hidden');
    const categoryDataObject = Object.fromEntries(sortedCategoryData);
    renderCategorySummary(sortedCategoryData, onCategoryClick);
    renderBarChart(sortedCategoryData, categoryDataObject);
};

const renderBarChart = (sortedData, originalData) => {
    const ctx = elements.chartCanvas.getContext('2d');
    const labels = sortedData.map(([category]) => category);
    const totals = sortedData.map(([, data]) => data.total);
    const backgroundColors = 'rgba(79, 70, 229, 0.8)';
    const borderColors = 'rgba(79, 70, 229, 1)';

    if (categoryChart) categoryChart.destroy();
    categoryChart = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Gasto Total', data: totals, backgroundColor: backgroundColors, borderColor: borderColors, borderWidth: 1 }] },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: 'Principais gastos no Período', font: { size: 16, weight: '600' }, padding: { top: 5, bottom: 15 } },
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const categoryName = context.label;
                            const categoryInfo = originalData[categoryName];
                            if (!categoryInfo) return '';
                            const total = `Valor Total: R$ ${categoryInfo.total.toFixed(2).replace('.', ',')}`;
                            const count = `Transações: ${categoryInfo.count}`;
                            const average = `Média: R$ ${categoryInfo.average.toFixed(2).replace('.', ',')}`;
                            return [total, count, average];
                        }
                    }
                }
            },
            scales: { x: { beginAtZero: true, ticks: { callback: function(value) { return 'R$ ' + value.toLocaleString('pt-BR'); } } } }
        }
    });
};

const renderCategorySummary = (sortedCategoryData, onCategoryClick) => {
    elements.categorySummaryTbody.innerHTML = '';
    sortedCategoryData.forEach(([category, data]) => {
        const rowEl = document.createElement('tr');
        rowEl.className = 'bg-white border-b hover:bg-gray-50 cursor-pointer';
        rowEl.innerHTML = `<td class="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">${category}</td><td class="px-4 py-3 text-center">${data.count}</td><td class="px-4 py-3 text-right font-semibold">R$ ${data.total.toFixed(2).replace('.', ',')}</td>`;
        rowEl.addEventListener('click', () => onCategoryClick(category));
        elements.categorySummaryTbody.appendChild(rowEl);
    });
};

export const renderSubcategoryAnalysis = (category, sortedSubcategoryData, onSubcategoryClick) => {
    elements.subcategoryAnalysis.classList.remove('hidden');
    elements.subcategoryTitle.textContent = `Análise da Categoria: ${category}`;
    elements.detailedExpenseListContainer.classList.add('hidden');
    
    elements.subcategorySummaryTbody.innerHTML = '';
    sortedSubcategoryData.forEach(([subcategory, data]) => {
        const rowEl = document.createElement('tr');
        rowEl.className = 'bg-white border-b hover:bg-gray-50 cursor-pointer';
        rowEl.innerHTML = `<td class="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">${subcategory}</td><td class="px-4 py-3 text-center">${data.count}</td><td class="px-4 py-3 text-right font-semibold">R$ ${data.total.toFixed(2).replace('.', ',')}</td>`;
        rowEl.addEventListener('click', () => onSubcategoryClick(subcategory));
        elements.subcategorySummaryTbody.appendChild(rowEl);
    });
};

export const renderDetailedExpenseList = (subcategory, expenses, currentSort) => {
    elements.detailedExpenseListContainer.classList.remove('hidden');
    elements.detailedListTitle.textContent = `Gastos em: ${subcategory}`;
    elements.detailedExpenseTbody.innerHTML = '';
    const sortedExpenses = [...expenses].sort((a, b) => {
        const valA = currentSort.key === 'date' ? new Date(a.date) : a.amount;
        const valB = currentSort.key === 'date' ? new Date(b.date) : b.amount;
        if (valA < valB) return currentSort.order === 'asc' ? -1 : 1;
        if (valA > valB) return currentSort.order === 'asc' ? 1 : -1;
        return 0;
    });
    sortedExpenses.forEach(exp => {
        const row = document.createElement('tr');
        row.className = 'bg-white border-b';
        row.innerHTML = `<td class="px-6 py-4">${new Date(exp.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td><td class="px-6 py-4">${exp.description || 'N/A'}</td><td class="px-6 py-4 font-medium text-red-500">R$ ${exp.amount.toFixed(2).replace('.', ',')}</td>`;
        elements.detailedExpenseTbody.appendChild(row);
    });
};

export const populateCategoryDropdowns = () => {
    elements.categorySelect.innerHTML = '<option value="">Selecione uma categoria</option>';
    Object.keys(categories).sort().forEach(categoryName => {
        const option = document.createElement('option');
        option.value = categoryName;
        option.textContent = categoryName;
        elements.categorySelect.appendChild(option);
    });
    elements.categorySelect.addEventListener('change', () => {
        elements.subcategorySelect.innerHTML = '<option value="">Selecione uma subcategoria</option>';
        const selectedCategory = elements.categorySelect.value;
        if (selectedCategory && categories[selectedCategory]) {
            categories[selectedCategory].sort().forEach(sub => {
                const option = document.createElement('option');
                option.value = sub;
                option.textContent = sub;
                elements.subcategorySelect.appendChild(option);
            });
        }
    });
};

export const getReportDates = () => {
    return { startDate: elements.startDate.valueAsDate, endDate: elements.endDate.valueAsDate, };
};

export const setReportDateValues = (startDate, endDate) => {
    elements.startDate.valueAsDate = startDate;
    elements.endDate.valueAsDate = endDate;
    elements.startDate.dispatchEvent(new Event('input'));
    elements.endDate.dispatchEvent(new Event('input'));
};

export const updateDateDisplay = (inputId, dateValue) => {
    const displayEl = inputId === 'start-date' ? elements.startDateDisplay : elements.endDateDisplay;
    if (!dateValue) { displayEl.value = ''; return; }
    const [year, month, day] = dateValue.split('-');
    displayEl.value = `${day}/${month}/${year}`;
};

export const setupTabsUI = (onTabChange) => {
    [elements.tabDashboard, elements.tabReports].forEach(tab => {
        tab.addEventListener('click', () => {
            const activeTabId = tab.id;
            [elements.tabDashboard, elements.tabReports].forEach(t => t.classList.remove('tab-active'));
            [elements.dashboardContent, elements.reportsContent].forEach(c => c.classList.add('hidden'));
            tab.classList.add('tab-active');
            if(activeTabId === 'tab-dashboard') elements.dashboardContent.classList.remove('hidden');
            else elements.reportsContent.classList.remove('hidden');
            onTabChange(activeTabId);
        });
    });
};

export const showFirestoreError = () => {
     elements.expenseList.innerHTML = `<li class="text-red-500 p-4">Ocorreu um erro ao carregar seus gastos. Verifique o console do navegador (F12) para um link de correção.</li>`;
     elements.noReportsData.textContent = "Erro ao carregar dados. Verifique o console.";
     elements.noReportsData.classList.remove('hidden');
};
