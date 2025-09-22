import logo from './logo.svg';
import './App.css';
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
// import Home from './Home';
import ExpenseSplitter from "./Home";


const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ExpenseSplitter />} />
      </Routes>
    </Router>
  );
};


export default App;
