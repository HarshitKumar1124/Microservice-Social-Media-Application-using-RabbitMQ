const {connectionSchema} = require('./schema');

class ConnectionRepository {

    async createConnection(userID){
        try{
            return await connectionSchema.create({
                userID
            });
        } catch(ex) {
            throw ex;
        }
    }

    async deleteConnection(userID){
        try{
            return await connectionSchema.deleteOne({userID});
        } catch(ex) {
            throw ex;
        }
    }

    async getConnection(TargetObject){
        try{
            return await connectionSchema.findOne(TargetObject);
        } catch(ex) {
            throw ex;
        }
    }

    async follow_Unfollow_User(authUser,targetUser,action){
        try{
            
            if(action=='follow'){

                const result = await connectionSchema.updateOne({ userID:authUser },{ 
                    $set: { [`following.${targetUser}`]: "true" }
                });

                const result2 = await connectionSchema.updateOne({userID:targetUser},{
                    $set: {[`followers.${authUser}`]:"true"}
                });

            } else {
                
                const result = await connectionSchema.updateOne({ userID:authUser },{ 
                    $unset: { [`following.${targetUser}`]: "" }
                });

                const result2 = await connectionSchema.updateOne({userID:targetUser},{
                    $unset: {[`followers.${authUser}`]:""}
                });
            }
            
        } catch(ex) {
            throw ex;
        }
    }
}

module.exports = ConnectionRepository;