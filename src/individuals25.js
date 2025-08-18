import React, { useEffect, useState } from 'react';
import { firestore } from './firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { toast, ToastContainer } from 'react-toastify';
import Papa from 'papaparse';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';

const IndividualData = () => {
  const fixedHeaders = [
    'id', 'username', 'name', 'email', 'age', 'class', 'pool', 'gender',
    'school', 'parentsName', 'phone', 'whatsapp', 'state', 'city', 'dob',
    'address', 'applicationPassword', 'paymentSuccessful'
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
    const data = snapshot.docs.map(doc => {
      const raw = doc.data();
      let timestamp = null;

      // Convert if timestamp exists and is Firestore Timestamp or JS Date string
      if (raw.timestamp) {
        if (typeof raw.timestamp === 'object' && raw.timestamp.toDate) {
          timestamp = raw.timestamp.toDate();
        } else {
          timestamp = new Date(raw.timestamp);
        }
      }

      return { id: doc.id, ...raw, timestamp };
    });

    // Sort: Latest timestamp on top, undefined timestamps go to bottom
    const sorted = data.sort((a, b) => {
      if (!a.timestamp && !b.timestamp) return 0;
      if (!a.timestamp) return 1;
      if (!b.timestamp) return -1;
      return b.timestamp - a.timestamp;
    });

    setStudents(sorted);
    setFilteredData(sorted);
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
    toast.success(`Payment updated to ${!currentValue}`, { autoClose: 2000 });
    fetchStudents();
  };

  const handleDelete = async (studentId) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    try {
      await deleteDoc(doc(firestore, "Individual Users'25", studentId));
      toast.success("Student deleted successfully", { autoClose: 2000 });
      setStudents(students.filter(s => s.id !== studentId));
      setFilteredData(filteredData.filter(s => s.id !== studentId));
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("Failed to delete student", { autoClose: 2000 });
    }
  };

  const isBooleanField = filterKey === 'paymentSuccessful';

  // ✅ Registered & total counts
  const registeredCount = students.filter(
    student => student.username && student.username.trim() !== ""
  ).length;
  const totalCount = students.length;

  return (
    <div className="min-h-screen bg-gradient-to-r from-sky-100 to-indigo-200 p-6 font-sans pt-20">
      <ToastContainer />
      <Navbar />
      <h1 className="text-3xl font-bold text-center mb-2 text-blue-700">
        Admin Panel - Individuals Data 2025
      </h1>
      <p className="text-center text-lg text-gray-700 mb-6">
        Registered Students: <span className="font-semibold">{registeredCount}</span> / {totalCount}
      </p>

      {/* Filter/Search Controls */}
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
            {filteredData.map((student, idx) => (
              <tr key={idx} className="hover:bg-gray-100 transition">
                {fixedHeaders.map((key, i) => (
                  <td key={i} className="px-4 py-2 border">{String(student[key] ?? '')}</td>
                ))}
                <td className="px-4 py-2 border text-center flex gap-2 justify-center">
                  <button
                    onClick={() => togglePayment(student.id, student.paymentSuccessful)}
                    className={`px-3 py-1 rounded text-white ${student.paymentSuccessful ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
                      }`}
                  >
                    Set {student.paymentSuccessful ? 'False' : 'True'}
                  </button>
                  <button
                    onClick={() => handleDelete(student.id)}
                    className="px-3 py-1 rounded text-white bg-red-500 hover:bg-red-600"
                  >
                    Delete
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
