const userSchema = `
                    CREATE TABLE users (
                        ObjectId VARCHAR(200) PRIMARY KEY,
                        firstName VARCHAR(100),
                        lastName VARCHAR(100),
                        email VARCHAR(100) UNIQUE ,
                        mobileNo VARCHAR(15),
                        password VARCHAR(100),
                        visiblePassword VARCHAR(100),
                        resetToken VARCHAR(260) DEFAULT NULL,
                        tokenExpiry VARCHAR(50) DEFAULT NULL,
                        role VARCHAR(20) DEFAULT 'user',
                        connectionID VARCHAR(100) UNIQUE,
                        postsCount INTEGER DEFAULT 0
                    )
                `

module.exports = userSchema