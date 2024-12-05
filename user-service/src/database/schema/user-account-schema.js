
/* Since PostgreSQL doesn't natively enforce the structure of JSON values stored in its json or jsonb columns. 
These types allow any valid JSON data, but you can use constraints and triggers to validate the structure. 
Or we can use other Application-Level Validators like JOI javascript library.  */

/*joi is a package for Node. js that provides a powerful tool for validating JavaScript objects. It allows developers to create complex, customizable rules for ensuring that the data passed to their applications is valid.*/


const userAccountSchema = `
                    CREATE TABLE userAccount (
                        userId VARCHAR(100) UNIQUE NOT NULL,
                        privacySettings JSONB,
                        accountStatus JSON,
                        FOREIGN KEY (userId) REFERENCES users (ObjectId)
                    )
                `

module.exports = userAccountSchema

// In PostgreSQL, a column with a UNIQUE constraint can contain multiple NULL values. 
// This behavior aligns with the SQL standard, which treats NULL as a value that is not equal
// to anything, including other NULL values. Therefore, the uniqueness constraint does not apply to NULL values.