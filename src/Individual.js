import React, { useEffect, useState } from 'react';
import { firestore } from './firebase';
import { useTable } from 'react-table';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore'; // Ensur
import { CSVLink } from 'react-csv';

const Individual = () => {
  const [data, setData] = useState([]);

  // Fetch data from Firestore
  const fetchData = async () => {
    const querySnapshot = await getDocs(collection(firestore, 'Individual Registration 24'));
    const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
    const specificDate = Timestamp.fromDate(new Date('2024-07-16T00:00:00Z'));
    const q = query(
      collection(firestore, 'individual registration'),
      where('createdAt', '>', specificDate)
    );
    const querySnapshot2 = await getDocs(q);
    const newData = querySnapshot2.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
    // Merge the two datasets
    const combinedData = [...docs, ...newData];
  
    // Sort the data
    const sortedData = combinedData.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.toMillis() - a.createdAt.toMillis(); // Descending order by createdAt
      } else if (a.createdAt) {
        return -1; // a comes before b
      } else if (b.createdAt) {
        return 1; // b comes before a
      } else {
        return 0; // No sorting if neither has createdAt
      }
    });
  
    setData(sortedData);
  };
  
  useEffect(() => {
    fetchData();
  }, []);
  

  const columns = React.useMemo(
    () => [
      {
        Header: 'City',
        accessor: 'city',
      },
      {
        Header: 'Date of Birth',
        accessor: 'dateofBirth',
      },
      {
        Header: 'Full Name',
        accessor: 'fullName',
      },
      {
        Header: 'Parent Email',
        accessor: 'parentEmail',
      },
      {
        Header: 'Parent Mobile',
        accessor: 'parentMobile',
      },
      {
        Header: 'Parent Name',
        accessor: 'parentName',
      },
      {
        Header: 'School Name',
        accessor: 'schoolName',
      },
      {
        Header: 'Selected Class',
        accessor: 'selectedClass',
      },
      {
        Header: 'Selected Pool',
        accessor: 'selectedPool',
      },
      {
        Header: 'Selected State',
        accessor: 'selectedState',
      },
      {
        Header: 'Student Mobile',
        accessor: 'studentMobile',
      },
      {
        Header: 'WhatsApp Number',
        accessor: 'whatsappNumber',
      },
    ],
    []
  );

  const tableInstance = useTable({ columns, data });

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = tableInstance;

  return (
    <div>
      <CSVLink data={data} headers={columns.map(col => ({ label: col.Header, key: col.accessor }))} filename="data.csv">
        Download as CSV
      </CSVLink>
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps()}>{column.render('Header')}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map(row => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map(cell => (
                  <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Individual;
