const router = require('express').Router();
const ctrl = require('../controllers/carController');

router.get('/', ctrl.getCars);
router.get('/:id', ctrl.getCarById);
router.post('/sync', ctrl.syncFromApi);

module.exports = router;