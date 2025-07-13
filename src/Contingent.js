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
    const docs = querySnapshot.docs.map(doc => {
      const docData = doc.data();
      return {
        id: doc.id,
        ...docData,
        createdAt: docData.createdAt?.toDate().toLocaleString() || '', // Convert Firestore Timestamp to string
      };
    });

    // Sort the data by parsed createdAt date
    const sortedData = docs.sort((a, b) => {
      const aDate = new Date(a.createdAt).getTime();
      const bDate = new Date(b.createdAt).getTime();
      return bDate - aDate;
    });

    setData(sortedData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns = React.useMemo(
    () => [
      { Header: 'City', accessor: 'city' },
      { Header: 'POC Email', accessor: 'pocEmail' },
      { Header: 'POC Mobile', accessor: 'pocMobile' },
      { Header: 'POC Name', accessor: 'pocName' },
      { Header: 'Principal Email', accessor: 'principalEmail' },
      { Header: 'Principal Mobile', accessor: 'principalMobile' },
      { Header: 'Principal Name', accessor: 'principalName' },
      { Header: 'School Address', accessor: 'schoolAddress' },
      { Header: 'School Name', accessor: 'schoolName' },
      { Header: 'Selected State', accessor: 'selectedState' },
      { Header: 'WhatsApp Number', accessor: 'whatsappNumber' },
      { Header: 'Created At', accessor: 'createdAt' },
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
      <CSVLink
        data={data}
        headers={columns.map(col => ({ label: col.Header, key: col.accessor }))}
        filename="contingent_data.csv"
      >
        Download as CSV
      </CSVLink>

      <table {...getTableProps()} style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()} style={{ borderBottom: '1px solid #ccc' }}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps()} style={{ padding: '8px', textAlign: 'left' }}>
                  {column.render('Header')}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map(row => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()} style={{ borderBottom: '1px solid #eee' }}>
                {row.cells.map(cell => (
                  <td {...cell.getCellProps()} style={{ padding: '8px' }}>
                    {cell.render('Cell')}
                  </td>
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
