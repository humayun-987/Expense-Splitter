import logo from './logo.svg';
import './App.css';
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Individual from './Individual';
import Contingent from './Contingent';
import IndividualData from './individuals25';
import ContingentData from './Contingent25';
import Home from './Home';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/individual" element={<IndividualData />} />
        <Route path="/contingent" element={<ContingentData />} />
      </Routes>
    </Router>
  );
};


export default App;
