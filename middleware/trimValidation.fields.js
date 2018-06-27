module.exports = (...fields) => (req, res, next) => {
    for (let i = 0; i < fields.length; i += 1) {
        const field = fields[i];
        if (req.body[field] !== req.body[field].trim()) {
            const message = `Some fields cannot start or end with whitespace. Check '${field}' for spaces.`;
            return res.status(400).json({
                generalMessage: 'Incorrect Field Entry',
                messages: [message],
            });
        }
    }
    return next();
};
