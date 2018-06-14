
module.exports = (...fields) => (req, res, next) => {
    for (let i = 0; i < fields.length; i += 1) {
        const field = fields[i];
        if (typeof req.body[field] !== 'string') {
            const message = `There is an incorrect field type for ${field} in your request body`;
            return res.status(422).json({
                generalMessage: 'Incorrect field type: expected String',
                messages: [message],
            });
        }
    }
    return next();
};
