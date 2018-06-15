userHasRoutePermission = (req, res, next,) => {
    if ((req.user._id.toString() !== req.params.id) && req.user.role != 'admin') {
        return res.status(400).json({
            generalMessage: 'Auth Problem',
            messages: ['You can\'t access this route with this access token'] });
    }
    return next();
};
userHasAdminPermission = (req, res, next,) => {
    if (req.user.role != 'admin') {
        return res.status(400).json({
            generalMessage: 'Auth Problem',
            messages: ['You can\'t access this route with this access token'] });
    }
    return next();
};

module.exports = {  userHasRoutePermission, userHasAdminPermission };
