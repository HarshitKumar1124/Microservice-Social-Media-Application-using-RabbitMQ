const {Pool} = require('../database')
const {ObjectId} = require('mongodb');
const bcrypt = require('bcrypt');

class UserRepository{

    async createTable(userSchema){
        try{
            await Pool.query(userSchema);
        } catch(ex){
            throw ex;
        }
    }

    async register(req,res){
        try{

            const { firstName ,lastName,email,mobileNo,password } = req.body;
            /* Hashing the password using bycrypt */
            const saltRounds = 10; // You can adjust the cost factor
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            const objectid = new ObjectId().toString();
            const response = await Pool.query(
                                            'INSERT INTO users VALUES($1,$2,$3,$4,$5,$6,$7)',
                                            [objectid,firstName,lastName,email,mobileNo,hashedPassword,password]
                                        );

            const privacySettingsDefault = {
                visibilityPrivate:false,
                showEmail:true,
                showAvailabilityStatus:true
            }

            const accountStatusDefault = {
                isDeactivated:false
            }

            const response2 = await Pool.query(
                                            `INSERT INTO userAccount VALUES($1,$2,$3)`,
                                            [objectid,privacySettingsDefault,accountStatusDefault]
                                        );
            
             
             return {
                objectid,
                email,
                
            }

        } catch (ex) {
            throw ex;
        }
    }

    async getUser(targetObj){
        try{

            const {field,value} = targetObj;
            const user = await Pool.query(`SELECT * FROM users
                WHERE ${field} = $1`,[value]);
                
            return user;

        } catch(ex){
            throw ex;
        }
    }

    async updateUser(objectid,bodyasArray){
        try{

            let values =[objectid];
            

            const setClause = bodyasArray.map((item,index)=>{
                const field = item[0];
                const value = item[1];
                values.push(value);
                return `${field} = $${index+2}`;
            }).join(',');

            // console.log('setClause as :: ',setClause);

            const query = `UPDATE users SET ${setClause} WHERE objectid = $1 RETURNING (firstname)`;
            const response = await Pool.query(query,values);
            return response?.rows[0];

        } catch (ex) {
            throw ex;
        }
    }

    async deleteUser(objectId) {
        try{

            // delete account settings related to this user
            const response2 = await Pool.query(`DELETE FROM userAccount
            WHERE userId = $1`,[objectId]);

            const response = await Pool.query(`DELETE FROM users
                WHERE objectid = $1`,[objectId]);

            // Here first we will delete the dependent table which has foreign key .
            // Here first userAccount table 's row will get deleted and then users row.
            // If we reverse the order then no operation will be performed because after deletion of users,
            // foreign key in useraccount refers to invalid value.

            // And due to its Atomic Nature , full transaction is omitted. It won't happen that users is ddeleted and their corresponding setting is still left.
                
        } catch(ex) {
            throw ex;
        }
    }


    async updateAccountSettings(userID,body){
        try{
            const {privacySettings,accountStatus} = body;

            // The issue in your SQL query is that you're using two SET clauses in one UPDATE statement. In SQL, an UPDATE statement only allows a single SET clause. You need to combine both assignments into one SET clause, separating them with a comma.

            await Pool.query(`UPDATE userAccount
                SET privacySettings=$1,
                accountStatus = $2
                WHERE userId=$3`,[privacySettings,accountStatus,userID]);
        } catch(ex){
            throw ex;
        }
    }
}

module.exports = UserRepository;