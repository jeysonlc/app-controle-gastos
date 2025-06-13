// Arquivo: js/app.js

import { firebaseConfig } from './config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { initAuth, attemptLogin, attemptSignUp, attemptLogout, getCurrentUser } from './auth.js';
import { initFirestore, addExpense, listenForExpenses, stopListeningForExpenses } from './firestore.js';
import * as UI from './ui.js';

// --- Estado Global do Aplicativo ---
let allUserExpenses = [];
let detailSortState = { key: 'date', order: 'desc' };
let categorySortState = { key: 'total', order: 'desc' };
let subcategorySortState = { key: 'total', order: 'desc' };
let lastClicked = { category: '', subcategory: '', expenses: [] };
let isLoginMode = true;

// --- Inicialização ---
const app = initializeApp(firebaseConfig);
initAuth(app);
initFirestore(app);

// --- Lógica de Callback ---
export const handleUserLogin = (user) => { UI.showAppScreen(user); listenForExpenses(user.uid); };
export const handleUserLogout = () => { UI.showLoginScreen(); stopListeningForExpenses(); allUserExpenses = []; };
export const handleExpensesUpdate = (expenses, error) => {
    if (error) { UI.showFirestoreError(); return; }
    allUserExpenses = expenses;
    UI.renderLatestExpenses(allUserExpenses);
    const activeTab = document.querySelector('.tab-active');
    if (activeTab && activeTab.id === 'tab-reports') {
        const activeFilter = document.querySelector('.filter-btn-active');
        if (activeFilter) activeFilter.click();
    }
};

// --- Funções de Análise ---
const updateReports = (startDate, endDate) => {
    const startTimestamp = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endTimestamp = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);
    const filteredExpenses = allUserExpenses.filter(exp => {
        const parts = exp.date.split('-');
        const expTimestamp = Date.UTC(parts[0], parts[1] - 1, parts[2]);
        return expTimestamp >= startTimestamp && expTimestamp <= endTimestamp;
    });
    const categoryData = filteredExpenses.reduce((acc, exp) => {
        if (!acc[exp.category]) acc[exp.category] = { total: 0, count: 0 };
        acc[exp.category].total += exp.amount;
        acc[exp.category].count += 1;
        return acc;
    }, {});
    for (const category in categoryData) {
        categoryData[category].average = categoryData[category].total / categoryData[category].count;
    }
    const sortedCategoryData = Object.entries(categoryData).sort(([keyA, valA], [keyB, valB]) => {
        const a = categorySortState.key === 'category' ? keyA.toLowerCase() : valA[categorySortState.key];
        const b = categorySortState.key === 'category' ? keyB.toLowerCase() : valB[categorySortState.key];
        if (a < b) return categorySortState.order === 'asc' ? -1 : 1;
        if (a > b) return categorySortState.order === 'asc' ? 1 : -1;
        return 0;
    });
    UI.updateReportsUI(sortedCategoryData, handleCategoryClick);
};

const handleCategoryClick = (category) => {
    lastClicked.category = category;
    const { startDate, endDate } = UI.getReportDates();
    const startTimestamp = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endTimestamp = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);
    const filteredExpenses = allUserExpenses.filter(exp => {
        const parts = exp.date.split('-');
        const expTimestamp = Date.UTC(parts[0], parts[1] - 1, parts[2]);
        return expTimestamp >= startTimestamp && expTimestamp <= endTimestamp && exp.category === category;
    });
    const subcategoryData = filteredExpenses.reduce((acc, exp) => {
        if (!acc[exp.subcategory]) acc[exp.subcategory] = { total: 0, count: 0 };
        acc[exp.subcategory].total += exp.amount;
        acc[exp.subcategory].count += 1;
        return acc;
    }, {});
    const sortedSubcategoryData = Object.entries(subcategoryData).sort(([keyA, valA], [keyB, valB]) => {
        const a = subcategorySortState.key === 'subcategory' ? keyA.toLowerCase() : valA[subcategorySortState.key];
        const b = subcategorySortState.key === 'subcategory' ? keyB.toLowerCase() : valB[subcategorySortState.key];
        if (a < b) return subcategorySortState.order === 'asc' ? -1 : 1;
        if (a > b) return subcategorySortState.order === 'asc' ? 1 : -1;
        return 0;
    });
    UI.renderSubcategoryAnalysis(category, sortedSubcategoryData, handleSubcategoryClick);
};

const handleSubcategoryClick = (subcategory) => {
    const { startDate, endDate } = UI.getReportDates();
    const startTimestamp = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endTimestamp = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);
    const expensesInSubcategory = allUserExpenses.filter(exp => {
        const parts = exp.date.split('-');
        const expTimestamp = Date.UTC(parts[0], parts[1] - 1, parts[2]);
        return expTimestamp >= startTimestamp && expTimestamp <= endTimestamp &&
               exp.category === lastClicked.category &&
               exp.subcategory === subcategory;
    });
    lastClicked.subcategory = subcategory;
    lastClicked.expenses = expensesInSubcategory;
    UI.renderDetailedExpenseList(subcategory, expensesInSubcategory, detailSortState);
};

const formatCurrency = (input) => {
    let value = input.value.replace(/\D/g, '');
    value = (value / 100).toFixed(2) + '';
    value = value.replace(".", ",");
    value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    input.value = value;
};

// --- Configuração dos Event Listeners ---
const setupEventListeners = () => {
    UI.setupTabsUI((activeTabId) => {
        if (activeTabId === 'tab-reports') {
            const activeFilter = document.querySelector('.filter-btn-active');
            if (!activeFilter && allUserExpenses.length > 0) document.querySelector('[data-period="30"]').click();
            else if (activeFilter) activeFilter.click();
            else { const endDate = new Date(); const startDate = new Date(); startDate.setDate(endDate.getDate() - 29); UI.setReportDateValues(startDate, endDate); }
        }
    });

    document.querySelectorAll('.period-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.period-filter-btn').forEach(b => b.classList.remove('filter-btn-active'));
            btn.classList.add('filter-btn-active');
            const period = btn.dataset.period;
            const today = new Date(); let startDate = new Date(); let endDate = new Date(today);
            if (period === 'current_month') startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            else if (period === 'previous_month') { const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1); startDate = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), 1); endDate = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0); }
            else if (period === 'year') startDate = new Date(today.getFullYear(), 0, 1);
            else startDate.setDate(today.getDate() - (parseInt(period) - 1));
            UI.setReportDateValues(startDate, endDate); updateReports(startDate, endDate);
        });
    });
    
    document.getElementById('custom-date-btn').addEventListener('click', () => {
        const { startDate, endDate } = UI.getReportDates();
        if (startDate && endDate) { document.querySelectorAll('.period-filter-btn').forEach(b => b.classList.remove('filter-btn-active')); updateReports(startDate, endDate); }
    });
    
    document.querySelectorAll('[data-sort-summary]').forEach(header => {
        header.addEventListener('click', () => {
            const sortKey = header.dataset.sortSummary;
            if (categorySortState.key === sortKey) categorySortState.order = categorySortState.order === 'asc' ? 'desc' : 'asc';
            else { categorySortState.key = sortKey; categorySortState.order = sortKey === 'category' ? 'asc' : 'desc'; }
            const activeFilter = document.querySelector('.filter-btn-active') || document.getElementById('custom-date-btn');
            activeFilter.click();
        });
    });
    
    document.querySelectorAll('[data-sort-subcategory]').forEach(header => {
        header.addEventListener('click', () => {
            const sortKey = header.dataset.sortSubcategory;
            if (subcategorySortState.key === sortKey) subcategorySortState.order = subcategorySortState.order === 'asc' ? 'desc' : 'asc';
            else { subcategorySortState.key = sortKey; subcategorySortState.order = sortKey === 'subcategory' ? 'asc' : 'desc'; }
            handleCategoryClick(lastClicked.category);
        });
    });

    document.querySelectorAll('[data-sort-detailed]').forEach(header => {
        header.addEventListener('click', () => {
            const sortKey = header.dataset.sortDetailed;
            if (detailSortState.key === sortKey) detailSortState.order = detailSortState.order === 'asc' ? 'desc' : 'asc';
            else { detailSortState.key = sortKey; detailSortState.order = 'desc'; }
            UI.renderDetailedExpenseList(lastClicked.subcategory, lastClicked.expenses, detailSortState);
        });
    });

    document.getElementById('start-date').addEventListener('input', (e) => { UI.updateDateDisplay('start-date', e.target.value); });
    document.getElementById('end-date').addEventListener('input', (e) => { UI.updateDateDisplay('end-date', e.target.value); });

    const authForm = document.getElementById('auth-form');
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('auth-error');
        errorDiv.classList.add('hidden');
        try {
            if (isLoginMode) await attemptLogin(email, password);
            else await attemptSignUp(email, password);
        } catch (error) {
            errorDiv.textContent = "Email ou senha inválidos.";
            errorDiv.classList.remove('hidden');
        }
    });

    document.getElementById('toggle-auth-mode').addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        document.getElementById('auth-title').textContent = isLoginMode ? 'Login' : 'Criar Conta';
        document.getElementById('auth-button').textContent = isLoginMode ? 'Entrar' : 'Cadastrar';
        document.getElementById('toggle-auth-mode').textContent = isLoginMode ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login';
        document.getElementById('auth-error').classList.add('hidden');
    });

    document.getElementById('logout-button').addEventListener('click', attemptLogout);

    const expenseForm = document.getElementById('expense-form');
    const amountInput = document.getElementById('expense-amount');
    amountInput.addEventListener('keyup', () => formatCurrency(amountInput));
    expenseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const addButton = document.getElementById('add-expense-button');
        const errorDiv = document.getElementById('expense-error');
        addButton.disabled = true;
        addButton.textContent = 'Adicionando...';
        errorDiv.classList.add('hidden');
        
        const amountString = amountInput.value;
        const amount = parseFloat(amountString.replace(/\./g, '').replace(',', '.'));
        
        const category = document.getElementById('expense-category').value;
        const subcategory = document.getElementById('expense-subcategory').value;
        const description = document.getElementById('expense-description').value;

        if (isNaN(amount) || amount <= 0 || !category || !subcategory) {
            errorDiv.textContent = "Todos os campos (exceto descrição) são obrigatórios.";
            errorDiv.classList.remove('hidden');
            addButton.disabled = false;
            addButton.textContent = 'Adicionar Gasto';
            return;
        }

        try {
            await addExpense({
                userId: getCurrentUser().uid,
                date: document.getElementById('expense-date').value,
                amount, category, subcategory,
                description: description.trim(),
                createdAt: new Date()
            });
            expenseForm.reset();
            document.getElementById('expense-date').valueAsDate = new Date();
            document.getElementById('expense-category').dispatchEvent(new Event('change'));
        } catch (error) {
            console.error("Erro ao adicionar gasto:", error);
            errorDiv.textContent = "Falha ao comunicar com o servidor.";
            errorDiv.classList.remove('hidden');
        } finally {
            addButton.disabled = false;
            addButton.textContent = 'Adicionar Gasto';
        }
    });
};

// --- Ponto de Entrada do Aplicativo ---
document.addEventListener('DOMContentLoaded', () => {
    UI.populateCategoryDropdowns();
    document.getElementById('expense-date').valueAsDate = new Date();
    setupEventListeners();
});
