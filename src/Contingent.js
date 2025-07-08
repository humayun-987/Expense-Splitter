import React, { useEffect, useState } from 'react';
import { firestore } from './firebase';
import { useTable } from 'react-table';
import { collection, getDocs } from 'firebase/firestore';
import { CSVLink } from 'react-csv';

const Contingent = () => {
  const [data, setData] = useState([]);

  // Fetch data from Firestore
  const fetchData = async () => {
    const querySnapshot = await getDocs(collection(firestore, 'Contingent Registration 24'));
    const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Sort the data
    const sortedData = docs.sort((a, b) => {
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
        Header: 'POC Email',
        accessor: 'pocEmail',
      },
      {
        Header: 'POC Mobile',
        accessor: 'pocMobile',
      },
      {
        Header: 'POC Name',
        accessor: 'pocName',
      },
      {
        Header: 'Principal Email',
        accessor: 'principalEmail',
      },
      {
        Header: 'Principal Mobile',
        accessor: 'principalMobile',
      },
      {
        Header: 'Principal Name',
        accessor: 'principalName',
      },
      {
        Header: 'School Address',
        accessor: 'schoolAddress',
      },
      {
        Header: 'School Name',
        accessor: 'schoolName',
      },
      {
        Header: 'Selected State',
        accessor: 'selectedState',
      },
      {
        Header: 'WhatsApp Number',
        accessor: 'whatsappNumber',
      },
      {
        Header: 'CreatedAt',
        accessor: 'createdAt',
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

export default Contingent;
