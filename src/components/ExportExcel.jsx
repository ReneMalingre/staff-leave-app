import React, { useState, useEffect } from 'react'
import axios from 'axios'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

const ExportExcel = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [employees, setEmployees] = useState([])
  const [bookings, setBookings] = useState([])

  useEffect(() => {
    fetchEmployeesAndBookings()
  }, [])

  const fetchEmployeesAndBookings = async () => {
    const employeesResponse = await axios.get(
      'http://localhost:3001/api/active-employees'
    )
    const bookingsResponse = await axios.get(
      'http://localhost:3001/api/bookings-next-year'
    )
    setEmployees(employeesResponse.data)
    setBookings(bookingsResponse.data)
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
        new Date(booking.startDate).setHours(0, 0, 0, 0) <=
          date.setHours(0, 0, 0, 0) &&
        date.setHours(0, 0, 0, 0) <=
          new Date(booking.endDate).setHours(0, 0, 0, 0)
    )
  }

  const calculateColumnWidths = wsData => {
    const colWidths = []
    const header = wsData[0]
    header.forEach((col, colIndex) => {
      let maxWidth = col.length
      wsData.forEach(row => {
        if (row[colIndex] && row[colIndex].toString().length > maxWidth) {
          maxWidth = row[colIndex].toString().length
        }
      })
      colWidths.push({ wch: maxWidth })
    })
    return colWidths
  }

  const formatDate = dateString => {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return 'N/A'
    }
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const generateExcel = async () => {
    setIsLoading(true)
    const dates = generateDates()

    // Generate header row for booking grid
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
    const wsData = [header]
    const staffTypeColors = {
      Optometrist: { fill: { fgColor: { rgb: 'FFC0CB' } } }, // example color for Optometrist
      Dispenser: { fill: { fgColor: { rgb: 'ADD8E6' } } }, // example color for Dispenser
      // Add more staff types and their colors as needed
    }

    employees.forEach(employee => {
      const row = [employee.homeBranch, employee.name, employee.staffType]
      dates.forEach(date => {
        if (isBooked(employee.id, date, bookings)) {
          row.push('Y')
        } else if (date.getDay() === 0) {
          // Sunday
          row.push('Sun')
        } else {
          row.push('')
        }
      })
      wsData.push(row)
    })

    // Create workbook and worksheet for booking grid
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // Apply styles and calculate column widths for booking grid
    ws['!cols'] = calculateColumnWidths(wsData)
    employees.forEach((employee, rowIndex) => {
      const staffType = employee.staffType
      const staffTypeStyle = staffTypeColors[staffType] || {}

      dates.forEach((_, colIndex) => {
        const cellRef = XLSX.utils.encode_cell({
          c: colIndex + 3,
          r: rowIndex + 1,
        }) // Adjust colIndex for header offset
        const cell = ws[cellRef]

        if (cell) {
          if (cell.v === 'Y') {
            cell.s = {
              ...staffTypeStyle,
              fill: { fgColor: { rgb: '00FF00' } }, // Green color for 'Y'
            }
          } else if (cell.v === 'Sun') {
            cell.s = {
              ...staffTypeStyle,
              font: { color: { rgb: 'FF0000' } }, // Red color for 'Sun'
            }
          } else {
            cell.s = staffTypeStyle
          }
        }
      })
    })

    XLSX.utils.book_append_sheet(wb, ws, 'Bookings Grid')

    // Generate data for the leave bookings table
    const bookingsHeader = [
      'Name',
      'Staff Type',
      'Branch',
      'Leave Type',
      'Start Date',
      'End Date',
      'Hours',
      'Status',
      'Approved By',
      'Date Approved',
    ]
    const bookingsData = bookings.map(booking => {
      const employee = employees.find(emp => emp.id === booking.employeeID)
      return [
        employee.name,
        employee.staffType,
        employee.homeBranch,
        booking.leaveType,
        formatDate(booking.startDate),
        formatDate(booking.endDate),
        booking.amountOfHours,
        booking.status,
        booking.actionedByName,
        formatDate(booking.actionedOn),
      ]
    })
    const wsBookings = XLSX.utils.aoa_to_sheet([
      bookingsHeader,
      ...bookingsData,
    ])

    // Calculate column widths for the leave bookings table
    wsBookings['!cols'] = calculateColumnWidths([
      bookingsHeader,
      ...bookingsData,
    ])

    XLSX.utils.book_append_sheet(wb, wsBookings, 'Bookings List')

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    saveAs(
      new Blob([wbout], { type: 'application/octet-stream' }),
      'employee_leave_bookings.xlsx'
    )
    setIsLoading(false)
  }

  return (
    <div>
      <button onClick={generateExcel} disabled={isLoading}>
        {isLoading ? 'Generating Excel...' : 'Export to Excel'}
      </button>
    </div>
  )
}

export default ExportExcel
