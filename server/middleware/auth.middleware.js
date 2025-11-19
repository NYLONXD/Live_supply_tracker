const app = require('express');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/user.model');
const Role = require('../models/role.model');
const { promisify } = require('util');
const verifyAsync = promisify(jwt.verify);
const authMiddleware = {};
authMiddleware.verifyToken = async (req, res, next) => {
    const token = req.headers['x-access-token'];
    if (!token) {
        return res.status(403).send({ message: 'No token provided!' });
    }
    try {
        const decoded = await verifyAsync(token, config.secret);
        req.userId = decoded.id;
        next();
    } catch (err) {
        return res.status(401).send({ message: 'Unauthorized!' });
    }
};
authMiddleware.isAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        const roles = await Role.find({ _id: { $in: user.roles } });
        for (let role of roles) {
            if (role.name === 'admin') {
                return next();
            }
        }
        return res.status(403).send({ message: 'Require Admin Role!' });
    } catch (err) {
        return res.status(500).send({ message: err });
    }
};
module.exports = authMiddleware;

