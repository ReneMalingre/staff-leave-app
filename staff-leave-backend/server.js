const sqlite3 = require('sqlite3').verbose()
const express = require('express')
const multer = require('multer')
const csv = require('csv-parser')
const fs = require('fs')
const cors = require('cors')
const app = express()
const upload = multer({ dest: 'uploads/' })

app.use(cors())
app.use(express.json())

const db = new sqlite3.Database(
  './staff-leave-backend/leaveBookings.db',
  err => {
    if (err) {
      console.error('Could not connect to database', err)
    } else {
      console.log('Connected to database')
    }
  }
)

// Define the header mapping
const headerMapping = {
  'Employee Id': 'employeeID',
  Employee: 'employeeName',
  'Start Date': 'startDate',
  'End Date': 'endDate',
  Type: 'leaveType',
  Amount: 'amountOfHours',
  'Est.Balance': 'estimatedBalance',
  Accrued: 'accruedLeave',
  Operation: 'operationName',
  Reason: 'leaveReason',
  Submitted: 'dateSubmitted',
  Status: 'status',
  'Actioned By': 'actionedByName',
  'Actioned On': 'actionedOn',
}

app.post('/api/upload', upload.single('csv'), (req, res) => {
  const results = []
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', data => {
      const mappedData = {}
      for (const key in data) {
        if (headerMapping[key]) {
          mappedData[headerMapping[key]] = data[key]
        }
      }

      // Filter out rows where endDate is more than two weeks in the past
      const endDate = new Date(mappedData.endDate)
      const twoWeeksAgo = new Date()
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

      if (endDate >= twoWeeksAgo) {
        results.push(mappedData)
      }
    })
    .on('end', () => {
      // Delete all rows in the bookings table
      db.run('DELETE FROM bookings', err => {
        if (err) {
          console.error('Could not delete existing bookings', err)
          res.status(500).json({ error: 'Could not delete existing bookings' })
          return
        }

        const employeeStmt = db.prepare(`
          INSERT OR IGNORE INTO employees (id, name, homeBranch, staffType, active)
          VALUES (?, ?, ?, ?, ?)
        `)
        const bookingStmt = db.prepare(`
          INSERT INTO bookings (employeeID, employeeName, leaveType, startDate, endDate, amountOfHours, estimatedBalance, accruedLeave, operationName, leaveReason, dateSubmitted, status, actionedByName, actionedOn)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)

        let processedRows = 0
        const totalRows = results.length

        results.forEach(row => {
          // Insert employee if not exists
          employeeStmt.run(
            row.employeeID,
            row.employeeName,
            row.homeBranch || null,
            row.staffType || null,
            1,
            err => {
              if (err) {
                console.error(err.message)
                return
              }
              // Insert booking
              bookingStmt.run(
                row.employeeID,
                row.employeeName,
                row.leaveType,
                row.startDate,
                row.endDate,
                row.amountOfHours,
                row.estimatedBalance,
                row.accruedLeave,
                row.operationName,
                row.leaveReason,
                row.dateSubmitted,
                row.status,
                row.actionedByName,
                row.actionedOn,
                afterEachRow
              )
            }
          )
        })

        function afterEachRow(err) {
          if (err) {
            console.error(err.message)
            return
          }
          processedRows++
          if (processedRows === totalRows) {
            employeeStmt.finalize()
            bookingStmt.finalize()
            res.json({ message: 'CSV processed successfully' })
            console.log('CSV processed successfully')
          }
        }
      })
    })
})

app.get('/api/bookings', (req, res) => {
  db.all('SELECT * FROM bookings', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message })
      return
    }
    res.json(rows)
  })
})

app.put('/api/employees/:id', (req, res) => {
  const { id } = req.params
  const { name, homeBranch, staffType, active } = req.body

  const updateStmt = db.prepare(`
    UPDATE employees
    SET name = ?, homeBranch = ?, staffType = ?, active = ?
    WHERE id = ?
  `)

  updateStmt.run(name, homeBranch, staffType, active, id, function (err) {
    if (err) {
      res.status(500).json({ error: err.message })
      return
    }
    res.json({ message: `Employee with ID ${id} updated successfully` })
  })

  updateStmt.finalize()
})

app.get('/api/employees', (req, res) => {
  db.all(
    'SELECT * FROM employees ORDER BY active desc, homeBranch, staffType, name',
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message })
        return
      }
      res.json(rows)
    }
  )
})

// Get active employees ordered by homeBranch, staffType, and name
app.get('/api/active-employees', (req, res) => {
  db.all(
    'SELECT * FROM employees WHERE active = 1 ORDER BY homeBranch, staffType, name',
    [],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message })
        return
      }
      res.json(rows)
    }
  )
})

// Get bookings for the next 365 days for active employees
app.get('/api/bookings-next-year', (req, res) => {
  const today = new Date()
  const nextYear = new Date(today)
  nextYear.setFullYear(today.getFullYear() + 1)

  db.all(
    `SELECT bookings.* FROM bookings
     JOIN employees ON bookings.employeeID = employees.id
     WHERE employees.active = 1
     AND (
       (bookings.startDate < ? AND bookings.endDate >= ?) OR
       (bookings.startDate BETWEEN ? AND ?) OR
       (bookings.endDate BETWEEN ? AND ?)
     )
     ORDER BY employees.name, bookings.startDate`,
    [
      today.toISOString(),
      nextYear.toISOString(),
      today.toISOString(),
      nextYear.toISOString(),
      today.toISOString(),
      nextYear.toISOString(),
    ],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message })
        return
      }
      res.json(rows)
    }
  )
})

// Add endpoint to clear bookings table
app.delete('/api/clear-bookings', (req, res) => {
  db.run('DELETE FROM bookings', err => {
    if (err) {
      res.status(500).json({ error: err.message })
    } else {
      res.json({ message: 'Bookings table cleared successfully' })
    }
  })
})

app.listen(3001, () => {
  console.log('Server is running on port 3001')
})
