// import React, { useState, useEffect } from "react";
// import { motion } from "framer-motion";
// import { db } from "./firebase";
// import { collection, addDoc, getDocs } from "firebase/firestore";

// export default function ExpenseSplitter() {
//   const [allUsers, setAllUsers] = useState([]);
//   const [people, setPeople] = useState([]);
//   const [newPersonName, setNewPersonName] = useState("");
//   const [expenses, setExpenses] = useState([]);
//   const [newExpense, setNewExpense] = useState({
//     payer: "",
//     amount: "",
//     beneficiaries: [],
//   });
//   const [settlements, setSettlements] = useState([]);
//   const [searchResults, setSearchResults] = useState([]);

//   // Fetch all users from Firebase
//   useEffect(() => {
//     const fetchUsers = async () => {
//       const snapshot = await getDocs(collection(db, "users"));
//       const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
//       setAllUsers(users);
//     };
//     fetchUsers();
//   }, []);

//   // Add a new person to group + Firebase if not exist
//   const addPerson = async (name) => {
//     if (!name) return;

//     if (people.find((p) => p.name.toLowerCase() === name.toLowerCase())) return;

//     let user = allUsers.find((u) => u.name.toLowerCase() === name.toLowerCase());

//     if (!user) {
//       const docRef = await addDoc(collection(db, "users"), { name });
//       user = { id: docRef.id, name };
//       setAllUsers((prev) => [...prev, user]);
//     }

//     setPeople((prev) => [...prev, user]);
//     setNewPersonName("");
//     setSearchResults([]);
//   };

//   // Handle search autocomplete
//   const handleSearchChange = (value) => {
//     setNewPersonName(value);
//     if (!value) {
//       setSearchResults([]);
//       return;
//     }
//     const results = allUsers.filter(
//       (u) =>
//         u.name.toLowerCase().includes(value.toLowerCase()) &&
//         !people.find((p) => p.id === u.id)
//     );
//     setSearchResults(results);
//   };

//   // Add new expense
//   const addExpense = () => {
//     if (!newExpense.payer || !newExpense.amount || newExpense.beneficiaries.length === 0)
//       return;

//     setExpenses((prev) => [
//       ...prev,
//       { ...newExpense, id: Date.now(), amount: parseFloat(newExpense.amount) },
//     ]);
//     setNewExpense({ payer: "", amount: "", beneficiaries: [] });
//   };

//   // Delete expense
//   const deleteExpense = (id) => {
//     setExpenses((prev) => prev.filter((e) => e.id !== id));
//   };

//   // Split expense among all group members
//   const splitAmongAll = (amount, payerId) => {
//     setNewExpense({
//       payer: payerId,
//       amount,
//       beneficiaries: people.map((p) => p.id),
//     });
//   };

//   // Calculate settlements
//   const calculateSettlement = () => {
//     let balance = {};
//     people.forEach((p) => (balance[p.id] = 0));

//     expenses.forEach((exp) => {
//       const share = exp.amount / exp.beneficiaries.length;
//       exp.beneficiaries.forEach((b) => (balance[b] -= share));
//       balance[exp.payer] += exp.amount;
//     });

//     let creditors = Object.entries(balance).filter(([id, val]) => val > 0);
//     let debtors = Object.entries(balance).filter(([id, val]) => val < 0);

//     creditors.sort((a, b) => b[1] - a[1]);
//     debtors.sort((a, b) => a[1] - b[1]);

//     let settlementsList = [];
//     let i = 0,
//       j = 0;

//     while (i < debtors.length && j < creditors.length) {
//       let [dId, dVal] = debtors[i];
//       let [cId, cVal] = creditors[j];

//       const amt = Math.min(-dVal, cVal);

//       settlementsList.push({
//         from: people.find((p) => p.id === dId).name,
//         to: people.find((p) => p.id === cId).name,
//         amount: amt.toFixed(2),
//       });

//       debtors[i][1] += amt;
//       creditors[j][1] -= amt;

//       if (debtors[i][1] === 0) i++;
//       if (creditors[j][1] === 0) j++;
//     }

//     setSettlements(settlementsList);
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-pink-100 p-6">
//       <motion.h1
//         initial={{ opacity: 0, y: -20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6 }}
//         className="text-3xl font-bold text-center text-purple-700 mb-8"
//       >
//         💸 Expense Splitter
//       </motion.h1>

//       <div className="grid md:grid-cols-2 gap-8">
//         {/* Add Person */}
//         <div className="bg-white rounded-2xl shadow-xl p-4 space-y-4">
//           <h2 className="text-xl font-semibold text-purple-600">Add Person</h2>

//           {/* Firebase users as buttons */}
//           <div className="flex flex-wrap gap-2 mb-2">
//             {allUsers.map((user) => (
//               <button
//                 key={user.id}
//                 disabled={people.find((p) => p.id === user.id)}
//                 onClick={() => addPerson(user.name)}
//                 className={`px-3 py-1 rounded-xl ${
//                   people.find((p) => p.id === user.id)
//                     ? "bg-gray-300 cursor-not-allowed"
//                     : "bg-purple-500 text-white hover:bg-purple-600"
//                 }`}
//               >
//                 {user.name}
//               </button>
//             ))}
//           </div>

//           {/* Optional search input */}
//           <input
//             type="text"
//             placeholder="Enter Name"
//             value={newPersonName}
//             onChange={(e) => handleSearchChange(e.target.value)}
//             className="w-full border p-2 rounded"
//           />
//           {searchResults.length > 0 && (
//             <div className="border rounded bg-white max-h-40 overflow-y-auto">
//               {searchResults.map((u) => (
//                 <div
//                   key={u.id}
//                   className="p-2 cursor-pointer hover:bg-purple-100"
//                   onClick={() => addPerson(u.name)}
//                 >
//                   {u.name}
//                 </div>
//               ))}
//             </div>
//           )}

//           <button
//             onClick={() => addPerson(newPersonName)}
//             className="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl"
//           >
//             Add Person
//           </button>

//           <h3 className="mt-4 font-semibold">Current Group</h3>
//           <ul className="space-y-1 text-gray-700">
//             {people.map((p) => (
//               <li key={p.id}>{p.name}</li>
//             ))}
//           </ul>
//         </div>

//         {/* Add Expense */}
//         <div className="bg-white rounded-2xl shadow-xl p-4 space-y-4">
//           <h2 className="text-xl font-semibold text-purple-600">Add Expense</h2>
//           <select
//             value={newExpense.payer}
//             onChange={(e) => setNewExpense({ ...newExpense, payer: e.target.value })}
//             className="w-full border p-2 rounded"
//           >
//             <option value="">Paid By</option>
//             {people.map((p) => (
//               <option key={p.id} value={p.id}>
//                 {p.name}
//               </option>
//             ))}
//           </select>

//           <input
//             type="number"
//             placeholder="Amount"
//             value={newExpense.amount}
//             onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
//             className="w-full border p-2 rounded"
//           />

//           <div>
//             <p className="text-gray-600">Beneficiaries:</p>
//             {people.map((p) => (
//               <label key={p.id} className="flex items-center gap-2">
//                 <input
//                   type="checkbox"
//                   checked={newExpense.beneficiaries.includes(p.id)}
//                   onChange={(e) => {
//                     if (e.target.checked) {
//                       setNewExpense({
//                         ...newExpense,
//                         beneficiaries: [...newExpense.beneficiaries, p.id],
//                       });
//                     } else {
//                       setNewExpense({
//                         ...newExpense,
//                         beneficiaries: newExpense.beneficiaries.filter((id) => id !== p.id),
//                       });
//                     }
//                   }}
//                 />
//                 {p.name}
//               </label>
//             ))}
//           </div>

//           <div className="flex gap-2">
//             <button
//               onClick={addExpense}
//               className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl"
//             >
//               Add Expense
//             </button>
//             <button
//               onClick={() => splitAmongAll(newExpense.amount || 0, newExpense.payer)}
//               className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl"
//             >
//               Split Among All
//             </button>
//           </div>

//           <ul className="mt-4 space-y-2 text-gray-700">
//             {expenses.map((e) => (
//               <li key={e.id} className="flex justify-between bg-gray-100 p-2 rounded">
//                 <span>
//                   {people.find((p) => p.id === e.payer)?.name} paid {e.amount} for{" "}
//                   {e.beneficiaries.length} people
//                 </span>
//                 <button onClick={() => deleteExpense(e.id)} className="text-red-500 font-bold">
//                   ❌
//                 </button>
//               </li>
//             ))}
//           </ul>
//         </div>
//       </div>

//       {/* Settlements */}
//       <div className="mt-10 text-center">
//         <div className="flex flex-wrap justify-center gap-4 mb-4">
//           <button
//             onClick={calculateSettlement}
//             className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-xl"
//           >
//             Calculate Settlements
//           </button>
//         </div>
//         <div className="max-w-lg mx-auto space-y-3">
//           {settlements.map((s, idx) => (
//             <motion.div
//               key={idx}
//               initial={{ opacity: 0, x: -20 }}
//               animate={{ opacity: 1, x: 0 }}
//               transition={{ duration: 0.4, delay: idx * 0.1 }}
//               className="bg-white shadow rounded-xl p-4 text-gray-700"
//             >
//               <strong>{s.from}</strong> pays{" "}
//               <span className="text-green-600">₹{s.amount}</span> to <strong>{s.to}</strong>
//             </motion.div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { db } from "./firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

export default function ExpenseSplitter() {
  const [allUsers, setAllUsers] = useState([]);
  const [people, setPeople] = useState([]);
  const [newPersonName, setNewPersonName] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({
    payer: "",
    amount: "",
    beneficiaries: [],
  });
  const [settlements, setSettlements] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, "users"));
      const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAllUsers(users);
    };
    fetchUsers();
  }, []);

  const addPerson = async (name) => {
    if (!name) return;
    if (people.find((p) => p.name.toLowerCase() === name.toLowerCase())) return;

    let user = allUsers.find((u) => u.name.toLowerCase() === name.toLowerCase());

    if (!user) {
      const docRef = await addDoc(collection(db, "users"), { name });
      user = { id: docRef.id, name };
      setAllUsers((prev) => [...prev, user]);
    }

    setPeople((prev) => [...prev, user]);
    setNewPersonName("");
    setSearchResults([]);
  };

  const handleSearchChange = (value) => {
    setNewPersonName(value);
    if (!value) {
      setSearchResults([]);
      return;
    }
    const results = allUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(value.toLowerCase()) &&
        !people.find((p) => p.id === u.id)
    );
    setSearchResults(results);
  };

  const addExpense = () => {
    if (!newExpense.payer || !newExpense.amount || newExpense.beneficiaries.length === 0)
      return;

    setExpenses((prev) => [
      ...prev,
      { ...newExpense, id: Date.now(), amount: parseFloat(newExpense.amount) },
    ]);
    setNewExpense({ payer: "", amount: "", beneficiaries: [] });
  };

  const deleteExpense = (id) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const splitAmongAll = (amount, payerId) => {
    setNewExpense({
      payer: payerId,
      amount,
      beneficiaries: people.map((p) => p.id),
    });
  };

  const calculateSettlement = () => {
    let balance = {};
    people.forEach((p) => (balance[p.id] = 0));

    expenses.forEach((exp) => {
      const share = exp.amount / exp.beneficiaries.length;
      exp.beneficiaries.forEach((b) => (balance[b] -= share));
      balance[exp.payer] += exp.amount;
    });

    let creditors = Object.entries(balance).filter(([id, val]) => val > 0);
    let debtors = Object.entries(balance).filter(([id, val]) => val < 0);

    creditors.sort((a, b) => b[1] - a[1]);
    debtors.sort((a, b) => a[1] - b[1]);

    let settlementsList = [];
    let i = 0,
      j = 0;

    while (i < debtors.length && j < creditors.length) {
      let [dId, dVal] = debtors[i];
      let [cId, cVal] = creditors[j];

      const amt = Math.min(-dVal, cVal);

      settlementsList.push({
        from: people.find((p) => p.id === dId).name,
        to: people.find((p) => p.id === cId).name,
        amount: amt.toFixed(2),
      });

      debtors[i][1] += amt;
      creditors[j][1] -= amt;

      if (debtors[i][1] === 0) i++;
      if (creditors[j][1] === 0) j++;
    }

    setSettlements(settlementsList);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-orange-50 p-6">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-3xl font-bold text-center text-blue-700 mb-8"
      >
        💸 Expense Splitter
      </motion.h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Add Person */}
        <div className="bg-white rounded-2xl shadow-xl p-4 space-y-4">
          <h2 className="text-xl font-semibold text-green-600">Add Person</h2>

          <div className="flex flex-wrap gap-2 mb-2">
            {allUsers.map((user) => (
              <button
                key={user.id}
                disabled={people.find((p) => p.id === user.id)}
                onClick={() => addPerson(user.name)}
                className={`px-3 py-1 rounded-xl ${
                  people.find((p) => p.id === user.id)
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-green-500 text-white hover:bg-green-600"
                }`}
              >
                {user.name}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Enter Name"
            value={newPersonName}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full border p-2 rounded"
          />
          {searchResults.length > 0 && (
            <div className="border rounded bg-white max-h-40 overflow-y-auto">
              {searchResults.map((u) => (
                <div
                  key={u.id}
                  className="p-2 cursor-pointer hover:bg-green-100"
                  onClick={() => addPerson(u.name)}
                >
                  {u.name}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => addPerson(newPersonName)}
            className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl"
          >
            Add Person
          </button>

          <h3 className="mt-4 font-semibold">Current Group</h3>
          <ul className="space-y-1 text-gray-700">
            {people.map((p) => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>
        </div>

        {/* Add Expense */}
        <div className="bg-white rounded-2xl shadow-xl p-4 space-y-4">
          <h2 className="text-xl font-semibold text-orange-600">Add Expense</h2>
          <select
            value={newExpense.payer}
            onChange={(e) => setNewExpense({ ...newExpense, payer: e.target.value })}
            className="w-full border p-2 rounded"
          >
            <option value="">Paid By</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Amount"
            value={newExpense.amount}
            onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
            className="w-full border p-2 rounded"
          />

          <div>
            <p className="text-gray-600">Beneficiaries:</p>
            {people.map((p) => (
              <label key={p.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newExpense.beneficiaries.includes(p.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setNewExpense({
                        ...newExpense,
                        beneficiaries: [...newExpense.beneficiaries, p.id],
                      });
                    } else {
                      setNewExpense({
                        ...newExpense,
                        beneficiaries: newExpense.beneficiaries.filter((id) => id !== p.id),
                      });
                    }
                  }}
                />
                {p.name}
              </label>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={addExpense}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl"
            >
              Add Expense
            </button>
            <button
              onClick={() => splitAmongAll(newExpense.amount || 0, newExpense.payer)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl"
            >
              Split Among All
            </button>
          </div>

          <ul className="mt-4 space-y-2 text-gray-700">
            {expenses.map((e) => (
              <li key={e.id} className="flex justify-between bg-gray-100 p-2 rounded">
                <span>
                  {people.find((p) => p.id === e.payer)?.name} paid {e.amount} for{" "}
                  {e.beneficiaries.length} people
                </span>
                <button onClick={() => deleteExpense(e.id)} className="text-red-500 font-bold">
                  ❌
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Settlements */}
      <div className="mt-10 text-center">
        <div className="flex flex-wrap justify-center gap-4 mb-4">
          <button
            onClick={calculateSettlement}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-xl"
          >
            Calculate Settlements
          </button>
        </div>
        <div className="max-w-lg mx-auto space-y-3">
          {settlements.map((s, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="bg-white shadow rounded-xl p-4 text-gray-700"
            >
              <strong>{s.from}</strong> pays{" "}
              <span className="text-blue-600">₹{s.amount}</span> to <strong>{s.to}</strong>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
