// src/components/EmployeeList.jsx
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import EmployeeEdit from './EmployeeEdit'

const EmployeeList = () => {
  const [employees, setEmployees] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState(null)

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/employees')
      setEmployees(response.data)
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const handleEditClick = employee => {
    setSelectedEmployee(employee)
  }

  const handleSave = async updatedEmployee => {
    try {
      await axios.put(
        `http://localhost:3001/api/employees/${updatedEmployee.id}`,
        updatedEmployee
      )
      setSelectedEmployee(null)
      fetchEmployees()
    } catch (error) {
      console.error('Error saving employee:', error)
    }
  }

  return (
    <div>
      <h2>Employee List</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Home Branch</th>
            <th>Staff Type</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(employee => (
            <tr key={employee.id}>
              <td>{employee.id}</td>
              <td>{employee.name}</td>
              <td>{employee.homeBranch}</td>
              <td>{employee.staffType}</td>
              <td>{employee.active ? 'Yes' : 'No'}</td>
              <td>
                <button onClick={() => handleEditClick(employee)}>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {selectedEmployee && (
        <EmployeeEdit employee={selectedEmployee} onSave={handleSave} />
      )}
    </div>
  )
}

export default EmployeeList
