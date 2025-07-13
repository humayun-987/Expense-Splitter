import React, { useEffect, useState } from 'react';
import { firestore } from './firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { toast, ToastContainer } from 'react-toastify';
import Papa from 'papaparse';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';

const ContingentData = () => {
  const fixedHeaders = [
    'id',
    'schoolName',
    'username',
    'numberOfStudents',
    'principalName',
    'pocName',
    'whatsapp',
    'schoolEmail',
    'pocEmail',
    'principalPhone',
    'pocPhone',
    'schoolAddress',
    'state',
    'city',
    'applicationPassword',
    'paymentSuccessful',
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
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setContingents(data);
    setFilteredData(data);
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

    if (!current) {
      toast.success('Payment updated to true', { autoClose: 2000 });
    } else {
      toast.warning('Payment updated to false', { autoClose: 2000 });
    }

    fetchContingents();
  };

  const isBooleanField = filterKey === 'paymentSuccessful';

  return (
    <div className="min-h-screen bg-gradient-to-r from-sky-100 to-indigo-200 p-6 font-sans pt-20">
      <ToastContainer />
      <Navbar />
      <h1 className="text-3xl font-bold text-center mb-6 text-blue-700">Admin Panel - Contingent Data 2025</h1>

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
                <td className="px-4 py-2 border text-center">
                  <button
                    onClick={() => togglePayment(c.id, c.paymentSuccessful)}
                    className={`px-3 py-1 rounded text-white ${c.paymentSuccessful ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                      }`}
                  >
                    Set {c.paymentSuccessful ? 'False' : 'True'}
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
