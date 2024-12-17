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

            /* Instead of UpdateOne() , we use findOneandUpdate() because , UpdateOne() doesn't return error if target not found */
            
            if(action=='follow'){

                const result = await connectionSchema.findOneAndUpdate(
                    { userID:authUser },
                    { $set: { [`following.${targetUser}`]: "true" }}
                );

                const result2 = await connectionSchema.findOneAndUpdate(
                    {userID:targetUser},
                    {$set: {[`followers.${authUser}`]:"true"}}
                );

            } else {
                
                const result = await connectionSchema.findOneAndUpdate(
                    { userID:authUser },
                    { $unset: { [`following.${targetUser}`]: "" }}
                );

                const result2 = await connectionSchema.findOneAndUpdate(
                    {userID:targetUser},
                    {$unset: {[`followers.${authUser}`]:""}}
                );
            }
            
        } catch(ex) {
            throw ex;
        }
    }
}

module.exports = ConnectionRepository;