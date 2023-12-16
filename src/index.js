import app from "./app.js";
import { connectDB } from "./db/index.js";
// require("dotenv").config({
//   path: "./.env",
// });
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

/*
Method One to Connect DAta base

const app = express();
const Port = process.env.PORT || 3000;

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
    app.on("error", (err) => {
      console.log(`Error connecting to DB ${err}`);
      throw err;
    });
    app.listen(Port, () => {
      console.log(`server listening on ${Port}`);
    });
  } catch (err) {
    console.error(err);
    throw err;
  }
})();
*/
connectDB()
  .then(() => {
    app.on("error", (err) => {
      console.log(`Error connecting to DB ${err}`);
      throw err;
    });
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server is listening on ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log(`Mongodb connection failed : ${err}`);
  });
