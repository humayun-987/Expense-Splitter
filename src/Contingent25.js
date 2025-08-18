import React, { useEffect, useState } from 'react';
import { firestore } from './firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { toast, ToastContainer } from 'react-toastify';
import Papa from 'papaparse';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';

const ContingentData = () => {
  const fixedHeaders = [
    'id', 'schoolName', 'username', 'numberOfStudents', 'principalName',
    'pocName', 'whatsapp', 'schoolEmail', 'pocEmail', 'principalPhone',
    'pocPhone', 'schoolAddress', 'state', 'city', 'applicationPassword',
    'paymentSuccessful'
  ];

  const [contingents, setContingents] = useState([]);
  const [filterKey, setFilterKey] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [searchId, setSearchId] = useState('');
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    fetchContingents();
  }, []);

  const fetchContingents = async () => {
    const snapshot = await getDocs(collection(firestore, "Contingent Users'25"));
    const data = snapshot.docs.map(doc => {
      const raw = doc.data();
      let timestamp = null;

      if (raw.timestamp) {
        if (typeof raw.timestamp === 'object' && raw.timestamp.toDate) {
          timestamp = raw.timestamp.toDate();
        } else {
          timestamp = new Date(raw.timestamp);
        }
      }

      return { id: doc.id, ...raw, timestamp };
    });

    // Sort by timestamp: latest first, undefined at bottom
    const sorted = data.sort((a, b) => {
      if (!a.timestamp && !b.timestamp) return 0;
      if (!a.timestamp) return 1;
      if (!b.timestamp) return -1;
      return b.timestamp - a.timestamp;
    });

    setContingents(sorted);
    setFilteredData(sorted);
  };

  const exportToCSV = () => {
    const csv = Papa.unparse(filteredData, { columns: fixedHeaders });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'contingent_data_2025.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFilter = () => {
    const value = filterValue === 'true' ? true : filterValue === 'false' ? false : filterValue;
    const filtered = contingents.filter(c => c[filterKey]?.toString() === value.toString());
    setFilteredData(filtered);
  };

  const handleSearch = () => {
    const found = contingents.find(c => c.id === searchId.trim());
    setFilteredData(found ? [found] : []);
  };

  const togglePayment = async (id, current) => {
    const docRef = doc(firestore, "Contingent Users'25", id);
    await updateDoc(docRef, { paymentSuccessful: !current });

    toast[!current ? 'success' : 'warning'](
      `Payment updated to ${!current}`, { autoClose: 2000 }
    );

    fetchContingents();
  };

  // ✅ Delete a contingent
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this contingent?")) {
      try {
        await deleteDoc(doc(firestore, "Contingent Users'25", id));
        toast.error("Contingent deleted!", { autoClose: 2000 });
        fetchContingents();
      } catch (error) {
        console.error("Error deleting document:", error);
        toast.error("Failed to delete contingent.");
      }
    }
  };

  const isBooleanField = filterKey === 'paymentSuccessful';

  // ✅ Registered & total contingent counts
  const registeredCount = contingents.filter(
    c => c.username && c.username.trim() !== ""
  ).length;
  const totalCount = contingents.length;

  return (
    <div className="min-h-screen bg-gradient-to-r from-sky-100 to-indigo-200 p-6 font-sans pt-20">
      <ToastContainer />
      <Navbar />
      <h1 className="text-3xl font-bold text-center mb-2 text-blue-700">
        Admin Panel - Contingent Data 2025
      </h1>
      <p className="text-center text-lg text-gray-700 mb-6">
        Registered Contingents: <span className="font-semibold">{registeredCount}</span> / {totalCount}
      </p>

      {/* Filters */}
      <div className="flex flex-wrap justify-center gap-4 mb-6">
        <input
          placeholder="Search by ID"
          value={searchId}
          onChange={e => setSearchId(e.target.value)}
          className="px-3 py-2 rounded border w-64"
        />
        <button onClick={handleSearch} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Search
        </button>

        <select
          onChange={e => setFilterKey(e.target.value)}
          className="px-3 py-2 rounded border"
          value={filterKey}
        >
          <option value="">Filter by</option>
          {fixedHeaders.map((h, idx) => (
            <option key={idx} value={h}>{h}</option>
          ))}
        </select>

        {isBooleanField ? (
          <select
            value={filterValue}
            onChange={e => setFilterValue(e.target.value)}
            className="px-3 py-2 rounded border w-48"
          >
            <option value="">Select value</option>
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        ) : (
          <input
            placeholder="Filter value"
            value={filterValue}
            onChange={e => setFilterValue(e.target.value)}
            className="px-3 py-2 rounded border w-48"
          />
        )}

        <button onClick={handleFilter} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          Apply Filter
        </button>

        <button onClick={exportToCSV} className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full text-sm text-left text-gray-700 border">
          <thead className="bg-blue-600 text-white">
            <tr>
              {fixedHeaders.map((header, idx) => (
                <th key={idx} className="px-4 py-2 border">{header}</th>
              ))}
              <th className="px-4 py-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((c, idx) => (
              <tr key={idx} className="hover:bg-gray-100 transition">
                {fixedHeaders.map((key, i) => (
                  <td key={i} className="px-4 py-2 border">{String(c[key] ?? '')}</td>
                ))}
                <td className="px-4 py-2 border text-center flex gap-2 justify-center">
                  <button
                    onClick={() => togglePayment(c.id, c.paymentSuccessful)}
                    className={`px-3 py-1 rounded text-white ${
                      c.paymentSuccessful ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                    }`}
                  >
                    Set {c.paymentSuccessful ? 'False' : 'True'}
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="px-3 py-1 rounded text-white bg-red-500 hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={fixedHeaders.length + 1} className="text-center py-4 text-gray-500">
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContingentData;
