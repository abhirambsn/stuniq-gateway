const {sequelize} = require('./connection');
const {DataTypes} = require('sequelize');
const User = require('./User');

const Payment = sequelize.define('payments', {
    payment_id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
    },
    apiKey: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    amount: {
        type: DataTypes.DOUBLE,
        allowNull: false
    },
    currency: {
        type: DataTypes.STRING,
        allowNull: false
    },
    s_callback: {
        type: DataTypes.STRING,
        allowNull: false
    },
    f_callback: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'pending'
    },
    description: {
        type: DataTypes.STRING,
        defaultValue: ''
    },
    name: {
        type: DataTypes.STRING,
        defaultValue: '',
        allowNull: false
    }
}, {timestamps: true, freezeTableName: true})

Payment.hasMany(User, {
    foreignKey: 'apiKey'
});

module.exports = Payment;