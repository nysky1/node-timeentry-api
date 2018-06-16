module.exports = (...fields) => (req, res, next) => {
    for (let i = 0; i < fields.length; i += 1) {
        const field = fields[i];
        if ((req.body[field] !== req.params[field])) {
            const message = `Body does not match params for '${field}'`;
            return res.status(400).json({
                generalMessage: 'Validation Error',
                messages: [message],
            });
        }
    }
    return next();
};
