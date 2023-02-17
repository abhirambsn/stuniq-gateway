const app = require("./app");
const http = require("http");
const { connectDb } = require("./models/connection");


const server = http.createServer(app);

const main = async () => {
  const dbConn = await connectDb();
  if (dbConn) {
    server.listen(app.get("port"), () => {
      console.log(`[*] Server listening on http://localhost:${app.get("port")}`);
    });
  } else {
    console.log("[-] Unable to connect to database");
  }
};

main();

