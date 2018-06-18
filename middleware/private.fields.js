module.exports = (...fields) => (req, res, next) => {  //follow up
    for (let i = 0; i < fields.length; i += 1) {
        const field = fields[i];
        if ((field in req.body)) {
            const message = `Field not allowed '${field}' in your request body`;
            return res.status(400).json({
                generalMessage: 'Validation Error',
                messages: [message],
            });
        }
    }
    return next();
};
