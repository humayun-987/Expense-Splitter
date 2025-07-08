import logo from './logo.svg';
import './App.css';
import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Individual from './Individual';
import Contingent from './Contingent';


const Home = () => (
  <div>
    <h1>Choose a Table</h1>
    <button>
      <Link to="/individual">Individual</Link>
    </button>
    <button>
      <Link to="/contingent">Contingent</Link>
    </button>
  </div>
);

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/individual" element={<Individual />} />
        <Route path="/contingent" element={<Contingent />} />
      </Routes>
    </Router>
  );
};


export default App;
