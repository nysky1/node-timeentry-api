var express = require('express');
var router = express.Router();

/* GET users listing. */
router.route('/events') 
  .get( (req, res) => {
    res.send('respond with a event resource');
  });

module.exports = {router};
 