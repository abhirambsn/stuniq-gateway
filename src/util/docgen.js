const swaggerAutogen = require("swagger-autogen");

const outfile = "../../swagger.json"
const endpointFiles = ["../app.js"]
const config = {}

swaggerAutogen()(outfile, endpointFiles, config).then(() => {
    console.log("Documentation generation Done")
})