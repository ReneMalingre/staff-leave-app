import React, { useEffect, useState } from 'react'
import axios from 'axios'
import './BookingGrid.css'

const BookingGrid = () => {
  const [employees, setEmployees] = useState([])
  const [bookings, setBookings] = useState([])
  const [startDate, setStartDate] = useState(new Date())

  useEffect(() => {
    fetchEmployees()
    fetchBookings()
  }, [])

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(
        'http://localhost:3001/api/active-employees'
      )
      setEmployees(response.data)
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const fetchBookings = async () => {
    try {
      const response = await axios.get(
        'http://localhost:3001/api/bookings-next-year'
      )
      console.log('bookings', response.data)
      setBookings(response.data)
    } catch (error) {
      console.error('Error fetching bookings:', error)
    }
  }

  const generateDates = () => {
    const dates = []
    const currentDate = new Date(startDate)
    for (let i = 0; i < 365; i++) {
      dates.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }
    return dates
  }

  const dates = generateDates()

  const isBooked = (employeeId, date) => {
    return bookings.some(
      booking =>
        booking.employeeID === employeeId &&
        new Date(booking.startDate) <= date &&
        new Date(booking.endDate) >= date
    )
  }

  const formatDate = date => {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0') // Month is 0-indexed
    return `${day}/${month}`
  }

  return (
    <div className="booking-grid-container">
      <div className="employee-names">
        <div className="employee-name" style={{ visibility: 'hidden' }}>
          Date
        </div>{' '}
        {/* Placeholder for alignment */}
        {employees.map(employee => (
          <div key={employee.id} className="employee-name">
            {employee.name}
          </div>
        ))}
      </div>

      <div className="booking-grid-wrapper">
        <div className="date-row">
          {dates.map((date, index) => (
            <div key={index} className="date-cell">
              {formatDate(date)}
            </div>
          ))}
        </div>
        <div className="booking-grid">
          {employees.map(employee => (
            <div key={employee.id} className="employee-row">
              {dates.map((date, index) => (
                <div
                  key={index}
                  className={`booking-cell ${isBooked(employee.id, date) ? 'booked' : ''}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default BookingGrid
