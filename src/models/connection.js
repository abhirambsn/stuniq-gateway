const {Sequelize} = require('sequelize');

const sequelize = new Sequelize(
    "postgresql://blockpay:Blockpay%4011022023@ap-south-1.11bf3df0-d033-4fa2-92a6-5aa1393533f2.aws.ybdb.io:5433/blockpay?ssl=true&sslmode=verify-full&sslrootcert=root.crt"
)

const connect = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
        return true;
    } catch(error) {
        console.error('Unable to connect to the database:', error);
        return false;
    }
}

module.exports = {
    sequelize,
    connectDb: connect
}