import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-r from-sky-100 to-indigo-200 flex flex-col items-center justify-center px-6 py-10 font-sans">
      <Navbar/>
      <h1 className="text-4xl md:text-5xl font-bold text-indigo-700 mb-6 text-center pt-16 md:pt-0">Admin Dashboard</h1>
      
      <p className="text-gray-700 text-center max-w-2xl mb-8">
        Welcome to the admin panel. Use the options below to view and manage the registered data for Individuals and Contingents.
        You can also edit the <span className="font-semibold text-indigo-800">payment status</span> for any entry by clicking the toggle button in the Actions column.
        A green button means payment is <span className="font-semibold text-green-700">Successful</span>, red means <span className="font-semibold text-red-700">Unsuccessful</span>.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl mb-12">
        <div
          onClick={() => navigate('/individual')}
          className="cursor-pointer bg-white shadow-lg hover:shadow-xl rounded-xl p-6 border-t-4 border-blue-500 transition hover:scale-105"
        >
          <h2 className="text-2xl font-semibold text-blue-700 mb-2">View Individual Data</h2>
          <p className="text-gray-600">Manage student entries who registered individually.</p>
        </div>

        <div
          onClick={() => navigate('/contingent')}
          className="cursor-pointer bg-white shadow-lg hover:shadow-xl rounded-xl p-6 border-t-4 border-purple-500 transition hover:scale-105"
        >
          <h2 className="text-2xl font-semibold text-purple-700 mb-2">View Contingent Data</h2>
          <p className="text-gray-600">Manage entries submitted through school/POCs.</p>
        </div>
      </div>

      <div className="text-sm text-gray-600 text-center max-w-xl">
        <p>
          You can also apply filters (e.g., filter by <code className="bg-gray-200 px-1 rounded">paymentSuccessful = true</code>) or search by ID directly from the data tables.
        </p>
      </div>
    </div>
  );
};

export default Home;
