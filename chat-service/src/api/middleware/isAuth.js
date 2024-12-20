const jwt = require("jsonwebtoken");
const axios = require('axios');


exports.isAuthenticate = async(req,res,next)=>{

  /* Here we can call LoadUser API of user Microservice to Check if the user is Authenticated or not */

//Fetching stored token from cookie 
   try{
    const  token  = req.cookies.JWT_TOKEN;
    // console.log("Auth" , token)

     //Fetching Current token from Local_cookie_storage file
    // const token=fs.readFileSync("cookie_local_storage.txt","utf8")

    // console.log(`current token fetched from local_cookie_storage is: ${token}`)
    if(!token)
    throw (`Please Login First to use this resource`);
    
    const decodedData = jwt.verify(token,process.env.JWT_SECRET);
    const response = await axios.get('http://localhost:8001/user/myprofile',{
      headers:{
        'cookie':`JWT_TOKEN=${token}`
      }
    });

    if(response?.status == false)
    throw (response?.error);
    
    req.user = response?.data?.user || response;
    next();

   }catch(error){

    // console.log("error de raha")
    console.log(error)
    res.status(401).send({
      auth:false,
      message: error.message || error
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