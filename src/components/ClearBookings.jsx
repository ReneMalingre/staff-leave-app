import React, { useState } from 'react'
import axios from 'axios'

const ClearBookings = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const clearBookings = async () => {
    setIsLoading(true)
    setMessage('')
    try {
      const response = await axios.delete(
        'http://localhost:3001/api/clear-bookings'
      )
      setMessage(response.data.message)
    } catch (error) {
      setMessage('Error clearing bookings table')
    }
    setIsLoading(false)
  }

  return (
    <div>
      <button onClick={clearBookings} disabled={isLoading}>
        {isLoading ? 'Clearing Bookings...' : 'Clear Bookings'}
      </button>
      {message && <p>{message}</p>}
    </div>
  )
}

export default ClearBookings
