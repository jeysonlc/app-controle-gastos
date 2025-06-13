// Arquivo: js/firestore.js

import { getFirestore, collection, addDoc, query, where, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { handleExpensesUpdate } from "./app.js";

let db;
let unsubscribeFromExpenses = null;

export const initFirestore = (app) => {
    db = getFirestore(app);
};

export const addExpense = (expenseData) => {
    return addDoc(collection(db, 'gastos'), expenseData);
};

export const listenForExpenses = (userId) => {
    if (unsubscribeFromExpenses) {
        unsubscribeFromExpenses();
    }
    
    const expensesQuery = query(collection(db, 'gastos'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    
    unsubscribeFromExpenses = onSnapshot(expensesQuery, (snapshot) => {
        const allUserExpenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        handleExpensesUpdate(allUserExpenses);
    }, (error) => {
        console.error("ERRO DO FIREBASE AO BUSCAR DADOS:", error);
        handleExpensesUpdate([], error); // Envia o erro para ser tratado na UI
    });
};

export const stopListeningForExpenses = () => {
    if (unsubscribeFromExpenses) {
        unsubscribeFromExpenses();
        unsubscribeFromExpenses = null;
    }
};
