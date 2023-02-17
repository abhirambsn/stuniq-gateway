const {sequelize} = require('./connection');
const {DataTypes} = require('sequelize');

const User = sequelize.define('users', {
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    image: {
        type: DataTypes.STRING,
        defaultValue: 'https://picusm.photos/200'
    },
    privateKey: {
        type: DataTypes.STRING,
        allowNull: false
    },
    apiKey: {
        type: DataTypes.STRING,
        allowNull: false
    },
    address: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    timestamps: true,
    freezeTableName: true
})

module.exports = User;