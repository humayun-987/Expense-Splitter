import React, { useEffect, useState } from 'react';
import { firestore } from './firebase'; // Your firebase config
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { toast, ToastContainer } from 'react-toastify';
import Papa from 'papaparse';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';

const IndividualData = () => {
  const fixedHeaders = [
    'id',
    'username',
    'name',
    'email',
    'age',
    'class',
    'pool',
    'gender',
    'school',
    'parentsName',
    'phone',
    'whatsapp',
    'state',
    'city',
    'dob',
    'address',
    'applicationPassword',
    'paymentSuccessful',
  ];

  const [students, setStudents] = useState([]);
  const [filterKey, setFilterKey] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [searchId, setSearchId] = useState('');
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const snapshot = await getDocs(collection(firestore, "Individual Users'25"));
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setStudents(data);
    setFilteredData(data);
  };

  const exportToCSV = () => {
    const csv = Papa.unparse(filteredData, { columns: fixedHeaders });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'individuals_data_2025.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFilter = () => {
    const value = filterValue === 'true' ? true : filterValue === 'false' ? false : filterValue;
    const filtered = students.filter(student => student[filterKey]?.toString() === value.toString());
    setFilteredData(filtered);
  };

  const handleSearch = () => {
    const found = students.find(student => student.id === searchId.trim());
    setFilteredData(found ? [found] : []);
  };

  const togglePayment = async (studentId, currentValue) => {
    const docRef = doc(firestore, "Individual Users'25", studentId);
    await updateDoc(docRef, { paymentSuccessful: !currentValue });

    if (!currentValue) {
      toast.success(`Payment updated to true`, { autoClose: 2000 });
    } else {
      toast.warning(`Payment updated to false`, { autoClose: 2000 });
    }

    fetchStudents();
  };

  const isBooleanField = filterKey === 'paymentSuccessful';

  return (
    <div className="min-h-screen bg-gray-100 p-6 font-sans pt-20">
      <ToastContainer />
      <Navbar />
      <h1 className="text-3xl font-bold text-center mb-6 text-blue-700">Admin Panel - Individuals Data 2025</h1>

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
            {filteredData.map((student, idx) => (
              <tr key={idx} className="hover:bg-gray-100 transition">
                {fixedHeaders.map((key, i) => (
                  <td key={i} className="px-4 py-2 border">{String(student[key] ?? '')}</td>
                ))}
                <td className="px-4 py-2 border text-center">
                  <button
                    onClick={() => togglePayment(student.id, student.paymentSuccessful)}
                    className={`px-3 py-1 rounded text-white ${student.paymentSuccessful ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                      }`}
                  >
                    Set {student.paymentSuccessful ? 'False' : 'True'}
                  </button>
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={fixedHeaders.length + 1} className="text-center py-4 text-gray-500">No data found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IndividualData;
