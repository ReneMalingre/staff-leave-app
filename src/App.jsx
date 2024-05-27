import React, { useState } from 'react'
import UploadCSV from './components/UploadCSV'
import './components/UploadCSV.css'
import EmployeeList from './components/EmployeeList'
// import BookingGrid from './components/BookingGrid'
import ExportCSV from './components/ExportCSV'
import ExportExcel from './components/ExportExcel'
import ClearBookings from './components/ClearBookings'
import './App.css'

const App = () => {
  const [showEmployeeList, setShowEmployeeList] = useState(false)

  const toggleEmployeeList = () => {
    setShowEmployeeList(!showEmployeeList)
  }
  return (
    <div className="App">
      <h2>Generate Leave Calendar</h2>
      <div className="component">
        <UploadCSV />
      </div>
      {/* <div className="component">
        <ExportCSV />
      </div> */}
      <div className="component">
        <ExportExcel />
      </div>
      <div className="component">
        <ClearBookings />
      </div>
      <button onClick={toggleEmployeeList}>
        {showEmployeeList ? 'Hide Employee List' : 'Show Employee List'}
      </button>
      {showEmployeeList && <EmployeeList />}
    </div>
  )
}

export default App
