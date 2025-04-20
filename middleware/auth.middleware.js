const jwt = require('jsonwebtoken');
const { Response } = require('../services/Response');

exports.authenticateUser = async (req, res, next) => {
    try {
        const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
        console.log({token})

        if (!token) {
            return Response(res, 401, 'Authentication required. No token provided.');
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            req.user = decoded.user;
            
            next();
        } catch (error) {
            return Response(res, 401, 'Invalid token');
        }
    } catch (error) {
        console.log({error})
        return Response(res, 500, error.message);
    }
};

// Optional: Middleware to check specific roles
exports.authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.roles)) {
            return Response(res, 403, 'You do not have permission to perform this action');
        }
        next();
    };
};
