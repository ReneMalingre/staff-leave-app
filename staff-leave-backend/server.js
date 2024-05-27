const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./leaveBookings.db");
const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const app = express();
const upload = multer({ dest: "uploads/" });

app.use(express.json());

app.post("/api/upload", upload.single("csv"), (req, res) => {
  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", () => {
      const employeeStmt = db.prepare(`
        INSERT INTO employees (name, homeBranch, staffType)
        VALUES (?, ?, ?)
      `);
      const bookingStmt = db.prepare(`
        INSERT INTO bookings (employeeID, employeeName, leaveType, startDate, endDate, amountOfHours, estimatedBalance, accruedLeave, operationName, leaveReason, dateSubmitted, status, actionedByName, actionedOn)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      results.forEach((row) => {
        db.get(
          "SELECT id FROM employees WHERE name = ?",
          [row.employeeName],
          (err, employee) => {
            if (err) {
              console.error(err.message);
              return;
            }

            if (employee) {
              // Employee exists, use existing employeeID
              bookingStmt.run(
                employee.id,
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
                row.actionedOn
              );
            } else {
              // Insert new employee with NULL or default values for missing fields
              const homeBranch = row.homeBranch || null; // Use null if homeBranch is not provided
              const staffType = row.staffType || null; // Use null if staffType is not provided

              employeeStmt.run(
                row.employeeName,
                homeBranch,
                staffType,
                function (err) {
                  if (err) {
                    console.error(err.message);
                    return;
                  }
                  const employeeID = this.lastID;
                  bookingStmt.run(
                    employeeID,
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
                    row.actionedOn
                  );
                }
              );
            }
          }
        );
      });

      employeeStmt.finalize();
      bookingStmt.finalize();

      res.json({ message: "CSV processed successfully" });
    });
});

app.get("/api/bookings", (req, res) => {
  db.all("SELECT * FROM bookings", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.put("/api/employees/:id", (req, res) => {
  const { id } = req.params;
  const { name, homeBranch, staffType } = req.body;

  const updateStmt = db.prepare(`
      UPDATE employees
      SET name = ?, homeBranch = ?, staffType = ?
      WHERE id = ?
    `);

  updateStmt.run(name, homeBranch, staffType, id, function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: `Employee with ID ${id} updated successfully` });
  });

  updateStmt.finalize();
});

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
