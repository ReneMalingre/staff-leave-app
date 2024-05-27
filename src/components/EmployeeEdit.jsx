// src/components/EmployeeEdit.jsx
import React, { useState } from 'react'
import PropTypes from 'prop-types'

const EmployeeEdit = ({ employee, onSave }) => {
  const [homeBranch, setHomeBranch] = useState(employee.homeBranch)
  const [staffType, setStaffType] = useState(employee.staffType)
  const [active, setActive] = useState(employee.active)

  const handleSaveClick = () => {
    const updatedEmployee = { ...employee, homeBranch, staffType, active }
    onSave(updatedEmployee)
  }

  return (
    <div>
      <h3>Edit Employee</h3>
      <div>
        <label>ID: </label>
        <span>{employee.id}</span>
      </div>
      <div>
        <label>Name: </label>
        <span>{employee.name}</span>
      </div>
      <div>
        <label>Home Branch: </label>
        <input
          type="text"
          value={homeBranch}
          onChange={e => setHomeBranch(e.target.value)}
        />
      </div>
      <div>
        <label>Staff Type: </label>
        <input
          type="text"
          value={staffType}
          onChange={e => setStaffType(e.target.value)}
        />
      </div>
      <div>
        <label>Active: </label>
        <input
          type="checkbox"
          checked={active}
          onChange={e => setActive(e.target.checked)}
        />
      </div>
      <button onClick={handleSaveClick}>Save</button>
    </div>
  )
}

EmployeeEdit.propTypes = {
  employee: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    homeBranch: PropTypes.string,
    staffType: PropTypes.string,
    active: PropTypes.bool.isRequired,
  }).isRequired,
  onSave: PropTypes.func.isRequired,
}

export default EmployeeEdit
