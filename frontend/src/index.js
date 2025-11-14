import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import axios from "axios";
import "./index.css";
axios.defaults.withCredentials = true;

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render( <React.StrictMode >
    <AuthProvider >
    <App/>
    </AuthProvider> 
    </React.StrictMode >
);