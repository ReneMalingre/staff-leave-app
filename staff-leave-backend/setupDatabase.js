const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('./staff-leave-backend/leaveBookings.db')

db.serialize(() => {
  // Create the bookings table
  db.run(`
      CREATE TABLE IF NOT EXISTS bookings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          employeeID INTEGER,
          employeeName TEXT,
          leaveType TEXT,
          startDate TEXT,
          endDate TEXT,
          amountOfHours SINGLE,
          estimatedBalance SINGLE,
          accruedLeave SINGLE,
          operationName TEXT,
          leaveReason TEXT,
          dateSubmitted TEXT,
          status TEXT,
          actionedByName TEXT,
          actionedOn TEXT,
          FOREIGN KEY (employeeID) REFERENCES employees(id)
      )
    `)

  // Create the employees table
  db.run(`
      CREATE TABLE IF NOT EXISTS employees (
          id INTEGER PRIMARY KEY,
          name TEXT,
          homeBranch TEXT,
          staffType TEXT
      )
    `)
})

db.close()
