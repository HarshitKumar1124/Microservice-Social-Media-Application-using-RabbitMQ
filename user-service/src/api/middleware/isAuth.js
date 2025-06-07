const jwt = require("jsonwebtoken");
const UserService = require('../../service/user-service');


exports.isAuthenticate = async(req,res,next)=>{

  const userService = new UserService();

//Fetching stored token from cookie 
   try{
    // console.log(req.cookies)
    const  token  = req.cookies.JWT_TOKEN;
    // console.log("Auth" , token)

     //Fetching Current token from Local_cookie_storage file
    // const token=fs.readFileSync("cookie_local_storage.txt","utf8")

    // console.log(`current token fetched from local_cookie_storage is: ${token}`)
    if(!token)
    throw (`Please Login First to use this resource`);
    
    const decodedData = jwt.verify(token,process.env.JWT_SECRET);
    let user = await userService.getUser({field:"objectid" , value:decodedData._id});
    req.user = user.rows[0];
    next();

   }catch(error){

    // console.log("error de raha")
    res.status(401).send({
      auth:false,
      message:`Un-Authenticated User. LOGIN Again!`
    })

   }

};


exports.isAuthoriseRole=(role)=>{
    return (req,res,next)=>{


        // console.log(loginUserInfo,role)

        if(role!==req.user.role)
        {

          res.status(401).send({
            auth:false,
            message:`Role: ${req.user.role} is not allowed`
          })
            
            return next(new Error(`Role: ${req.user.role} is not allowed`))
        }

        next();
    }
}