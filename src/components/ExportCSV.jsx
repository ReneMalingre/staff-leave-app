import React, { useState } from 'react'
import axios from 'axios'
import { saveAs } from 'file-saver'
import * as Papa from 'papaparse'

const ExportCSV = () => {
  const [isLoading, setIsLoading] = useState(false)

  const fetchEmployeesAndBookings = async () => {
    const employeesResponse = await axios.get(
      'http://localhost:3001/api/active-employees'
    )
    const bookingsResponse = await axios.get(
      'http://localhost:3001/api/bookings-next-year'
    )
    return {
      employees: employeesResponse.data,
      bookings: bookingsResponse.data,
    }
  }

  const generateDates = () => {
    const dates = []
    const currentDate = new Date()
    for (let i = 0; i < 365; i++) {
      dates.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }
    return dates
  }

  const isBooked = (employeeId, date, bookings) => {
    return bookings.some(
      booking =>
        booking.employeeID === employeeId &&
        new Date(booking.startDate) <= date &&
        new Date(booking.endDate) >= date
    )
  }

  const generateCSV = async () => {
    setIsLoading(true)
    const { employees, bookings } = await fetchEmployeesAndBookings()
    const dates = generateDates()

    // Generate header row
    const header = [
      'Branch',
      'Name',
      'Staff Type',
      ...dates.map(
        date =>
          `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
      ),
    ]

    // Generate rows for each employee
    const rows = employees.map(employee => {
      const row = [employee.homeBranch, employee.name, employee.staffType]
      dates.forEach(date => {
        row.push(isBooked(employee.id, date, bookings) ? 'Y' : '')
      })
      return row
    })

    const csvData = [header, ...rows]
    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    saveAs(blob, 'employee_leave_bookings.csv')
    setIsLoading(false)
  }

  return (
    <div>
      <button onClick={generateCSV} disabled={isLoading}>
        {isLoading ? 'Generating CSV...' : 'Export CSV'}
      </button>
    </div>
  )
}

export default ExportCSV
