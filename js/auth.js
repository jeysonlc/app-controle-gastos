// Arquivo: js/auth.js

import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { handleUserLogin, handleUserLogout } from "./app.js";

let auth;

export const initAuth = (app) => {
    auth = getAuth(app);
    onAuthStateChanged(auth, user => {
        if (user) {
            handleUserLogin(user);
        } else {
            handleUserLogout();
        }
    });
};

export const getCurrentUser = () => {
    return auth.currentUser;
};

export const attemptLogin = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
};

export const attemptSignUp = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
};

export const attemptLogout = () => {
    return signOut(auth);
};
