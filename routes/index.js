const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();

// Connect to SQLite database
const db = new sqlite3.Database('./database/arendaja-kandideerimise-ylesanne.db', (err) => {
    if (err) {
        console.error('Error connecting to the database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});


// Get all repertories and repertories rows info combined
router.get('/all-repertories', (req, res) => {
    const query = `SELECT
    rr.id AS repertory_row_id, 
    r.id AS repertory_id, 
    r.name, 
    r.start_date, 
    r.end_date, 
    r.submitter_name, 
    r.submitter_email, 
    r.submitter_phone,
    rr.title,  
    rr.performer, 
    rr.authors, 
    rr.frequency, 
    rr.duration
FROM 
    repertory r
JOIN 
    repertory_row rr 
ON 
    r.id = rr.repertory_id; `;

    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ data: rows });
        }
    });
});

// Add a new repertory
router.post('/add-repertory', (req, res) => {
    const {
        name,
        start_date,
        end_date,
        submitter_name,
        submitter_email,
        submitter_phone,
        rows
    } = req.body;

    const insertRepertoryQuery = `
        INSERT INTO repertory (
            name, start_date, end_date, submitter_name, submitter_email, submitter_phone
        ) VALUES (?, ?, ?, ?, ?, ?);
    `;

    // Start a database transaction
    db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to start transaction: ' + err.message });
        }

        // Insert into the `repertory` table
        db.run(
            insertRepertoryQuery,
            [name, start_date, end_date, submitter_name, submitter_email, submitter_phone],
            function (err) {
                if (err) {
                    // Rollback transaction on error
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: 'Failed to insert repertory: ' + err.message });
                }

                // Get the inserted repertory's ID
                const repertoryId = this.lastID;

                // Prepare the `repertory_row` insertion query
                const insertRepertoryRowQuery = `
                    INSERT INTO repertory_row (
                        repertory_id, title, performer, authors, frequency, duration
                    ) VALUES (?, ?, ?, ?, ?, ?);
                `;

                // Insert each row into `repertory_row`
                const promises = rows.map((row) =>
                    new Promise((resolve, reject) => {
                        const { title, performer, authors, frequency, duration } = row;
                        db.run(
                            insertRepertoryRowQuery,
                            [repertoryId, title, performer, authors, frequency, duration],
                            function (err) {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            }
                        );
                    })
                );

                // Wait for all rows to be inserted
                Promise.all(promises)
                    .then(() => {
                        db.run('COMMIT', (err) => {
                            if (err) {
                                return res.status(500).json({ error: 'Failed to commit transaction: ' + err.message });
                            }
                            res.status(200).json({ message: 'Repertory and rows added successfully!' });
                        });
                    })
                    .catch((err) => {
                        // Rollback transaction on error
                        db.run('ROLLBACK');
                        res.status(500).json({ error: 'Failed to insert repertory rows: ' + err.message });
                    });
            }
        );
    });
});

// Update a repertory
router.put('/update-repertory/:repertory_id', (req, res) => {
    const repertoryId = req.params.repertory_id;
    const {
        name,
        start_date,
        end_date,
        submitter_name,
        submitter_email,
        submitter_phone,
        rows
    } = req.body;

    const updateRepertoryQuery = `
        UPDATE repertory
        SET name = ?, start_date = ?, end_date = ?, submitter_name = ?, submitter_email = ?, submitter_phone = ?
        WHERE id = ?;
    `;

    db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to start transaction: ' + err.message });
        }

        // Update the `repertory` table
        db.run(
            updateRepertoryQuery,
            [name, start_date, end_date, submitter_name, submitter_email, submitter_phone, repertoryId],
            function (err) {
                if (err) {
                    db.run('ROLLBACK'); // Rollback transaction on error
                    return res.status(500).json({ error: 'Failed to update repertory: ' + err.message });
                }

                // Prepare the `repertory_row` update query
                const updateRepertoryRowQuery = `
                    UPDATE repertory_row
                    SET title = ?, performer = ?, authors = ?, frequency = ?, duration = ?
                    WHERE id = ? AND repertory_id = ?;
                `;

                // Update each row in `repertory_row`
                const promises = rows.map((row) =>
                    new Promise((resolve, reject) => {
                        const { id, title, performer, authors, frequency, duration } = row;
                        db.run(
                            updateRepertoryRowQuery,
                            [title, performer, authors, frequency, duration, id, repertoryId],
                            function (err) {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            }
                        );
                    })
                );

                // Wait for all rows to be updated
                Promise.all(promises)
                    .then(() => {
                        db.run('COMMIT', (err) => {
                            if (err) {
                                return res.status(500).json({ error: 'Failed to commit transaction: ' + err.message });
                            }
                            res.status(200).json({ message: 'Repertory and rows updated successfully!' });
                        });
                    })
                    .catch((err) => {
                        // Rollback transaction on error
                        db.run('ROLLBACK');
                        res.status(500).json({ error: 'Failed to update repertory rows: ' + err.message });
                    });
            }
        );
    });
});

// Search work and repertory info
router.get('/search-work', (req, res) => {
    const { iswc } = req.query;

    const query = `
      SELECT 
          w.id AS work_id, 
          wa.id AS work_author_id,
          w.title, 
          w.duration, 
          w.iswc,  
          wa.author_name, 
          wa.role,
          rr.repertory_id,
          rr.performer,
          rr.frequency
      FROM 
          work w
      LEFT JOIN 
          work_author wa 
      ON 
          w.id = wa.work_id
      LEFT JOIN 
          repertory_row rr 
      ON 
          w.id = rr.work_id
      WHERE 
        w.iswc LIKE ?;
    `;

    const params = [`%${iswc}%`];

    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.status(200).json({ data: rows });
        }
    });
});

module.exports = router;
