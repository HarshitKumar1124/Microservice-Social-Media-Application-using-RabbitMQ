const AWS = require("aws-sdk");
const dotenv = require("dotenv");
const Path = require("path");

const envPath = Path.resolve(
  __dirname,
  "../../../../Environment/user-service.env"
);
dotenv.config({ path: envPath });

const awsConnect = async () => {
  try {
    // Manually configure AWS credentials (not recommended for production)
    // console.log(process.env.AWS_ACCESS_KEY_ID);
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Replace with your AWS Access Key ID
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // Replace with your AWS Secret Access Key
      region: process.env.AWS_REGION, // Specify your Lambda region
    });
    console.log("AWS Account connected successfully");
  } catch (ex) {
    console.log(`Unable to connect to AWS Account due to :: ${ex}`);
  }
};

module.exports = { awsConnect };
