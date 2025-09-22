import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  query,
  orderBy,
  serverTimestamp,
  getDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

export default function ExpenseSplitterWithRooms() {
  // --- global lists & local state
  const [allUsers, setAllUsers] = useState([]); // users collection
  const [mode, setMode] = useState("local"); // local | trip
  const [roomAction, setRoomAction] = useState("join"); // join | create
  const [userName, setUserName] = useState("");
  const [currentTripId, setCurrentTripId] = useState(null);
  const [currentTripName, setCurrentTripName] = useState("");
  const [people, setPeople] = useState([]); // current session members (array of {id, name})
  const [newPersonName, setNewPersonName] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // expenses are either from DB (trip) or local
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({
    payer: "",
    amount: "",
    beneficiaries: [],
    description: "",
  });
  const [settlements, setSettlements] = useState([]);

  // trip creation / join form
  const [tripForm, setTripForm] = useState({ name: "", id: "" });

  // snapshot unsubscribe refs
  const tripDocUnsub = useRef(null);
  const tripExpensesUnsub = useRef(null);

  // constants
  const LOCAL_STORAGE_KEY = "expense_splitter_local_state_v1";
  const ROOM_STORAGE_KEY = "expense_splitter_current_room";

  // --- Fetch all users once (for searching/adding)
  useEffect(() => {
    let mounted = true;
    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, "users"));
        const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        if (mounted) setAllUsers(users);
      } catch (e) {
        console.error("Failed to fetch users:", e);
      }
    };
    fetchUsers();
    return () => {
      mounted = false;
    };
  }, []);

  // --- Load local state from localStorage if present (local mode)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed) {
          if (parsed.people) setPeople(parsed.people);
          if (parsed.expenses) setExpenses(parsed.expenses);
          // optional: restore settlements if you saved them
          if (parsed.settlements) setSettlements(parsed.settlements);
        }
      }
    } catch (e) {
      console.warn("Failed to read local storage", e);
    }
  }, []);

  // persist local mode state to localStorage when people/expenses change and mode === "local"
  useEffect(() => {
    if (mode !== "local") return;
    const toSave = { people, expenses, settlements };
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.warn("Failed to save local state", e);
    }
  }, [people, expenses, settlements, mode]);


  // --- Trip realtime listeners setup / cleanup
  useEffect(() => {
    // whenever mode or currentTripId changes, clean up old listeners and (if trip-mode) attach new ones
    // cleanup
    if (tripDocUnsub.current) {
      tripDocUnsub.current();
      tripDocUnsub.current = null;
    }
    if (tripExpensesUnsub.current) {
      tripExpensesUnsub.current();
      tripExpensesUnsub.current = null;
    }

    if (mode === "trip" && currentTripId) {
      const tripRef = doc(db, "trips", currentTripId);

      // listen to trip doc for members updates and metadata
      tripDocUnsub.current = onSnapshot(
        tripRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (Array.isArray(data.members)) {
              // ensure members shape is correct
              setPeople(data.members);
            } else {
              setPeople([]);
            }
            if (data.name) setCurrentTripName(data.name);
          } else {
            // trip doc deleted/doesn't exist
            setPeople([]);
            setExpenses([]);
            setCurrentTripId(null);
            setMode("local");
            setCurrentTripName("");
          }
        },
        (err) => {
          console.error("Trip doc snapshot error", err);
        }
      );

      // listen to expenses subcollection in this trip, order by createdAt
      const expensesRef = collection(db, "trips", currentTripId, "expenses");
      const q = query(expensesRef, orderBy("createdAt", "asc"));
      tripExpensesUnsub.current = onSnapshot(
        q,
        (querySnap) => {
          const loaded = querySnap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setExpenses(loaded);
        },
        (err) => {
          console.error("Trip expenses snapshot error", err);
        }
      );
    } else {
      // mode local -> ensure expenses/people are from localStorage (they are already)
    }

    // cleanup on unmount
    return () => {
      if (tripDocUnsub.current) tripDocUnsub.current();
      if (tripExpensesUnsub.current) tripExpensesUnsub.current();
    };
  }, [mode, currentTripId]);

  useEffect(() => {
    const savedRoom = localStorage.getItem(ROOM_STORAGE_KEY);
    if (savedRoom) {
      try {
        const room = JSON.parse(savedRoom);
        if (room.id && room.name) {
          setCurrentTripId(room.id);
          setCurrentTripName(room.name);
          setMode("trip");
          // Optionally: set tripForm.id and tripForm.name for forms
          setTripForm({ id: room.id, name: room.name });
        }
      } catch (e) {
        console.warn("Failed to parse saved room info", e);
      }
    }
  }, []);

  // --- Helper: create a trip (room)
  const createTrip = async () => {
    if (!tripForm.name || !userName) {
      return toast.warning("Enter trip name and your name first");
    }
    try {
      // create creator user (or reuse if exists in users collection)
      let creator = allUsers.find(
        (u) => u.name.toLowerCase() === userName.toLowerCase()
      );
      if (!creator) {
        const uRef = await addDoc(collection(db, "users"), { name: userName });
        creator = { id: uRef.id, name: userName };
        setAllUsers((prev) => [...prev, creator]);
      }

      // add trip doc with creator as first member
      const docRef = await addDoc(collection(db, "trips"), {
        name: tripForm.name,
        createdBy: userName,
        createdAt: serverTimestamp(),
        members: [{ id: creator.id, name: creator.name }],
      });

      setCurrentTripId(docRef.id);
      setCurrentTripName(tripForm.name);
      setMode("trip");
      setTripForm((t) => ({ ...t, id: docRef.id }));
      localStorage.setItem(
        ROOM_STORAGE_KEY,
        JSON.stringify({ id: docRef.id, name: tripForm.name })
      );
      toast.success(`Trip created! ID: ${docRef.id}`);
    } catch (e) {
      console.error("createTrip failed", e);
      toast.error("Failed to create trip. See console.");
    }
  };

  // --- Helper: join trip by name + id
  const joinTrip = async () => {
    if (!tripForm.name || !tripForm.id || !userName) {
      return toast.warning("Enter trip name, trip ID, and your name first");
    }
    try {
      const tripRef = doc(db, "trips", tripForm.id);
      const tripSnap = await getDoc(tripRef);
      if (!tripSnap.exists()) {
        return toast.error("Trip not found. Check ID.");
      }
      const data = tripSnap.data();
      if (data.name !== tripForm.name) {
        return toast.error("Trip name doesn't match ID. Check both values.");
      }

      // ensure joiner exists in users collection
      let joiner = allUsers.find(
        (u) => u.name.toLowerCase() === userName.toLowerCase()
      );
      if (!joiner) {
        const uRef = await addDoc(collection(db, "users"), { name: userName });
        joiner = { id: uRef.id, name: userName };
        setAllUsers((prev) => [...prev, joiner]);
      }

      // check if already member; if not, add
      const already = (data.members || []).some((m) => m.id === joiner.id);
      if (!already) {
        await updateDoc(tripRef, {
          members: arrayUnion({ id: joiner.id, name: joiner.name }),
        });
      }

      setCurrentTripId(tripForm.id);
      setCurrentTripName(data.name || tripForm.name);
      setMode("trip");
      localStorage.setItem(
        ROOM_STORAGE_KEY,
        JSON.stringify({ id: tripForm.id, name: data.name || tripForm.name })
      );
      toast.success("Joined trip. Members & expenses will load in realtime.");
    } catch (e) {
      console.error("joinTrip failed", e);
      toast.error("Failed to join trip. See console.");
    }
  };


  // --- Add person function: adds to local people or to trip members in db
  const addPerson = async (name) => {
    if (!name) return;
    // avoid duplicates in current people list (case-insensitive)
    if (people.find((p) => p.name.toLowerCase() === name.toLowerCase())) return;

    // check if user exists in global users list
    let user = allUsers.find((u) => u.name.toLowerCase() === name.toLowerCase());

    if (!user) {
      // create user in global users collection
      try {
        const uRef = await addDoc(collection(db, "users"), { name });
        user = { id: uRef.id, name };
        setAllUsers((prev) => [...prev, user]);
      } catch (e) {
        console.error("Failed to add to users collection", e);
        // if DB failed but we are in local mode, fallback to create local id
        if (mode === "local") {
          user = { id: `local-${Date.now()}`, name };
        } else {
          toast.error("Failed to add user to DB; try local mode or check console.");
          return;
        }
      }
    }

    if (mode === "local") {
      // local mode - add to people local state
      setPeople((prev) => [...prev, { id: user.id, name: user.name }]);
      setNewPersonName("");
      setSearchResults([]);
    } else {
      // trip mode - add to trip doc members using arrayUnion
      try {
        const tripRef = doc(db, "trips", currentTripId);
        // ensure the member isn't already present in trip (read doc and check)
        const tripSnap = await getDoc(tripRef);
        if (!tripSnap.exists()) {
          toast.error("Trip no longer exists.");
          setMode("local");
          setCurrentTripId(null);
          return;
        }
        const tripData = tripSnap.data();
        const already = (tripData.members || []).some(
          (m) => m.id && m.id === user.id
        );
        if (already) {
          // no-op, members will update via snapshot
          setNewPersonName("");
          setSearchResults([]);
          return;
        }
        await updateDoc(tripRef, {
          members: arrayUnion({ id: user.id, name: user.name }),
        });
        // members will update via onSnapshot
        setNewPersonName("");
        setSearchResults([]);
      } catch (e) {
        console.error("Failed to add member to trip", e);
        toast.error("Failed to add member to trip. See console.");
      }
    }
  };

  // --- handle search input for people (works across allUsers and excludes existing people)
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

  // --- Add expense either to local or to trip's expenses subcollection
  const addExpense = async () => {
    // validations
    if (!newExpense.payer) return toast.warning("Select payer");
    if (!newExpense.amount || isNaN(parseFloat(newExpense.amount))) return toast.warning("Enter valid amount");
    if (!newExpense.beneficiaries || newExpense.beneficiaries.length === 0) return toast.warning("Select at least one beneficiary");

    const payerObj = people.find((p) => p.id === newExpense.payer);
    const beneficiaryNames = newExpense.beneficiaries.map((id) => people.find((p) => p.id === id)?.name || "Unknown");

    const prepared = {
      payerId: newExpense.payer,
      payerName: payerObj?.name || "Unknown",
      amount: parseFloat(newExpense.amount),
      beneficiaries: newExpense.beneficiaries,
      beneficiaryNames,
      description: newExpense.description || "",
      createdAt: serverTimestamp(),
    };

    if (mode === "local") {
      // local create (use timestamp locally)
      const localEntry = { id: `local-${Date.now()}`, ...prepared, createdAt: Date.now() };
      setExpenses((prev) => [...prev, localEntry]);
      setNewExpense({ payer: "", amount: "", beneficiaries: [], description: "" });
    } else {
      // trip mode -> add to subcollection trips/{tripId}/expenses
      try {
        await addDoc(collection(db, "trips", currentTripId, "expenses"), prepared);
        // onSnapshot will pick it up
        setNewExpense({ payer: "", amount: "", beneficiaries: [], description: "" });
      } catch (e) {
        console.error("Failed to add expense to trip", e);
        toast.error("Failed to add expense. See console.");
      }
    }
  };


  // --- Split Among All convenience
  const splitAmongAll = () => {
    const amount = newExpense.amount || "";
    setNewExpense({
      ...newExpense,
      beneficiaries: people.map((p) => p.id),
      // keep payer if set
    });
  };

  // --- calculate settlements (works for both local and trip-mode, using current 'people' and 'expenses')
  const calculateSettlement = () => {
    // build balance dict
    let balance = {};
    people.forEach((p) => (balance[p.id] = 0));

    // Important: ensure we ignore any expenses that do not have beneficiaries or payer in current people
    const validExpenses = expenses.filter((exp) => {
      // if exp has payerId and beneficiaries array
      if (!exp || !exp.payerId || !Array.isArray(exp.beneficiaries) || exp.beneficiaries.length === 0) return false;
      // ensure payer and beneficiaries are in people
      if (!balance.hasOwnProperty(exp.payerId)) return false;
      for (let b of exp.beneficiaries) if (!balance.hasOwnProperty(b)) return false;
      return true;
    });

    validExpenses.forEach((exp) => {
      const share = parseFloat(exp.amount) / exp.beneficiaries.length;
      exp.beneficiaries.forEach((b) => {
        balance[b] -= share;
      });
      balance[exp.payerId] += parseFloat(exp.amount);
    });

    let creditors = Object.entries(balance).filter(([id, val]) => val > 0);
    let debtors = Object.entries(balance).filter(([id, val]) => val < 0);

    creditors.sort((a, b) => b[1] - a[1]);
    debtors.sort((a, b) => a[1] - b[1]);

    let settlementsList = [];
    let i = 0,
      j = 0;

    // convert to mutable arrays of numbers
    creditors = creditors.map(([id, val]) => [id, val]);
    debtors = debtors.map(([id, val]) => [id, val]);

    while (i < debtors.length && j < creditors.length) {
      let [dId, dVal] = debtors[i];
      let [cId, cVal] = creditors[j];

      const amt = Math.min(-dVal, cVal);

      settlementsList.push({
        from: people.find((p) => p.id === dId)?.name || dId,
        to: people.find((p) => p.id === cId)?.name || cId,
        amount: amt.toFixed(2),
      });

      debtors[i][1] += amt;
      creditors[j][1] -= amt;

      // use a tolerance for float rounding
      if (Math.abs(debtors[i][1]) < 1e-9) i++;
      if (Math.abs(creditors[j][1]) < 1e-9) j++;
    }

    setSettlements(settlementsList);
  };

  // --- Leave trip (cleanup listeners and switch to local)
  const leaveTrip = () => {
    if (tripDocUnsub.current) {
      tripDocUnsub.current();
      tripDocUnsub.current = null;
    }
    if (tripExpensesUnsub.current) {
      tripExpensesUnsub.current();
      tripExpensesUnsub.current = null;
    }
    setMode("local");
    setCurrentTripId(null);
    setCurrentTripName("");
    setPeople([]);
    setExpenses([]);
    setSettlements([]);
    localStorage.removeItem(ROOM_STORAGE_KEY);
  };

  // --- Utility: show readable list of beneficiary names for an expense
  const getBeneficiaryNames = (exp) => {
    if (exp.beneficiaryNames && exp.beneficiaryNames.length) return exp.beneficiaryNames.join(", ");
    if (Array.isArray(exp.beneficiaries) && exp.beneficiaries.length) {
      return exp.beneficiaries.map((id) => people.find((p) => p.id === id)?.name || id).join(", ");
    }
    return "";
  };

  // --- UI JSX
  return (

    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-white
 p-6">
      <ToastContainer position="top-right" autoClose={3000} />
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-3xl font-bold text-center text-blue-600 mb-10"
      >
        💸 Expense Splitter — Manage Trips & Expenses
      </motion.h1>

      {/* Mode selection */}
      {/* Mode selection */}
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          {/* Mode Toggle */}
          <div>
            <label className="block font-semibold">Mode</label>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  leaveTrip();
                  setMode("local");
                }}
                className={`px-3 py-2 rounded-xl ${mode === "local" ? "bg-green-600 text-white" : "bg-gray-200"
                  }`}
              >
                Use Local Mode
              </button>
              <button
                onClick={() => setMode("trip")}
                className={`px-3 py-2 rounded-xl ${mode === "trip" ? "bg-blue-600 text-white" : "bg-gray-200"
                  }`}
              >
                Use Trip Room
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Current:{" "}
              <strong>
                {mode === "local"
                  ? "Local mode (not shared)"
                  : currentTripName
                    ? `Trip room: ${currentTripName}`
                    : "Trip room (no trip selected)"}
              </strong>
            </p>
          </div>

          {/* Room controls if DB mode selected */}
          {mode === "trip" && !currentTripId && (
            <div className="space-y-4 w-full md:w-1/2">
              {/* Switch between Join / Create */}
              <div className="flex gap-2">
                <button
                  onClick={() => setRoomAction("join")}
                  className={`flex-1 px-3 py-2 rounded-xl font-medium ${roomAction === "join"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-200 text-gray-700"
                    }`}
                >
                  Join Trip
                </button>
                <button
                  onClick={() => setRoomAction("create")}
                  className={`flex-1 px-3 py-2 rounded-xl font-medium ${roomAction === "create"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700"
                    }`}
                >
                  Create Trip
                </button>
              </div>

              {/* Forms */}
              {roomAction === "join" ? (
                <div className="space-y-2">
                  <input
                    className="w-full border p-2 rounded"
                    placeholder="Trip Name"
                    value={tripForm.name}
                    onChange={(e) =>
                      setTripForm((t) => ({ ...t, name: e.target.value }))
                    }
                  />
                  <input
                    className="w-full border p-2 rounded"
                    placeholder="Trip ID"
                    value={tripForm.id}
                    onChange={(e) =>
                      setTripForm((t) => ({ ...t, id: e.target.value }))
                    }
                  />
                  <input
                    className="w-full border p-2 rounded"
                    placeholder="Your Name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                  />

                  <button
                    onClick={joinTrip}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-xl"
                  >
                    Join Trip
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    className="w-full border p-2 rounded"
                    placeholder="Trip Name"
                    value={tripForm.name}
                    onChange={(e) =>
                      setTripForm((t) => ({ ...t, name: e.target.value }))
                    }
                  />
                  <input
                    className="w-full border p-2 rounded"
                    placeholder="Your Name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                  />

                  <button
                    onClick={() => createTrip(userName)}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-xl"
                  >
                    Create Trip
                  </button>
                </div>
              )}
            </div>
          )}

          {/* If inside a trip, show Trip details + Leave button */}
          {mode === "trip" && currentTripId && (
            <div className="text-right">
              <div className="text-sm text-gray-600">
                <span>
                  Trip Name: <strong>{currentTripName}</strong>
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(currentTripName);
                    toast.success("Trip Name copied!");
                  }}
                  className="p-1 rounded"
                >
                  <img src="/copy (1).png" alt="Copy" className="w-4 h-4" />
                </button>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                <span>
                  Trip ID: <code className="px-2 py-1 bg-gray-100 rounded">{currentTripId}</code>
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(currentTripId);
                    toast.success("Trip ID copied!");
                  }}
                  className="p-1 rounded"
                >
                  <img src="/copy (1).png" alt="Copy" className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={leaveTrip}
                className="mt-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-xl"
              >
                Leave Trip
              </button>
            </div>
          )}
        </div>
      </div>


      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Add Person */}
        <div className="bg-white rounded-2xl shadow-xl p-4 space-y-4">
          <h2 className="text-xl font-semibold text-green-600">Add Person</h2>

          {/* <div className="flex flex-wrap gap-2 mb-2">
            {allUsers.slice(0, 12).map((user) => ( // show a subset for quick add
              <button
                key={user.id}
                disabled={people.find((p) => p.id === user.id)}
                onClick={() => addPerson(user.name)}
                className={`px-3 py-1 rounded-xl ${people.find((p) => p.id === user.id)
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-green-500 text-white hover:bg-green-600"
                  }`}
              >
                {user.name}
              </button>
            ))}
          </div> */}

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
          <div className="flex flex-wrap gap-2 mt-2">
            {people.length === 0 && (
              <span className="text-gray-400">No members yet</span>
            )}
            {people.map((p) => (
              <button
                key={p.id}
                className="flex items-center px-4 py-[6px] rounded-lg bg-orange-500 text-white hover:bg-orange-600"
              >
                <span>{p.name}</span>
              </button>
            ))}
          </div>

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

          <div>
            <p className="text-gray-600">Description (optional)</p>
            <input
              type="text"
              placeholder="E.g., Dinner at The Roof, taxi to airport..."
              value={newExpense.description}
              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              className="w-full border p-2 rounded"
            />
          </div>

          <div className="flex gap-2">
            <button onClick={addExpense} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl">
              Add Expense
            </button>
            <button
              onClick={splitAmongAll}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl"
            >
              Split Among All
            </button>
          </div>

          <ul className="mt-4 space-y-2 text-gray-700 max-h-72 overflow-y-auto">
            {expenses.length === 0 && <li className="text-gray-400">No expenses yet</li>}
            {expenses.map((e) => (
              <li key={e.id || e.createdAt} className="flex flex-col bg-gray-100 p-2 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm">
                      <strong>{people.find((p) => p.id === e.payerId)?.name || e.payerName || "Unknown"}</strong>{" "}
                      paid <strong>₹{parseFloat(e.amount).toFixed(2)}</strong>
                    </div>
                    <div className="text-xs text-gray-600">
                      For: {getBeneficiaryNames(e)} • {e.beneficiaries?.length || 0} people
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">{e.createdAt && e.createdAt.toDate ? new Date(e.createdAt.toDate()).toLocaleString() : (typeof e.createdAt === "number" ? new Date(e.createdAt).toLocaleString() : "")}</div>
                    <button
                      onClick={async () => {
                        // deleting expense: implement DB delete
                        if (mode === "local") {
                          setExpenses((prev) => prev.filter((ex) => ex.id !== e.id));
                        } else {
                          try {
                            // dynamic import: deleteDoc
                            // to keep everything in one file import deleteDoc at top. (If missing add `deleteDoc` to imports)
                            await deleteDoc(doc(db, "trips", currentTripId, "expenses", e.id));
                            // snapshot will update UI
                          } catch (err) {
                            console.error("delete expense failed", err);
                            toast.error("Failed to delete. See console.");
                          }
                        }
                      }}
                      className="text-red-500 text-sm"
                    >
                      ❌
                    </button>
                  </div>
                </div>

                {e.description && <div className="mt-2 text-sm text-gray-700">• {e.description}</div>}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Settlements */}
      <div className="mt-8 max-w-4xl mx-auto text-center">
        <div className="flex flex-wrap justify-center gap-4 mb-4">
          <button onClick={calculateSettlement} className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-xl">
            Calculate Settlements
          </button>
        </div>
        <div className="max-w-lg mx-auto space-y-3">
          {settlements.length === 0 && <div className="text-gray-500">No settlements calculated yet</div>}
          {settlements.map((s, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.06 }}
              className="bg-white shadow rounded-xl p-4 text-gray-700"
            >
              <strong>{s.from}</strong> pays <span className="text-blue-600">₹{s.amount}</span> to <strong>{s.to}</strong>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}