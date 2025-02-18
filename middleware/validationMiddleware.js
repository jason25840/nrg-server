const { body, validationResult } = require('express-validator');

const validateProfileUpdate = [
  body('pursuits')
    .isArray()
    .withMessage('Pursuits must be an array')
    .custom((pursuits) => {
      return pursuits.every((p) => p.pursuit && p.level);
    })
    .withMessage('Each pursuit must include pursuit and level'),
  body('accomplishments')
    .isArray()
    .withMessage('Accomplishments must be an array')
    .custom((accomplishments) => {
      return accomplishments.every((a) => a.type && a.details);
    })
    .withMessage('Each accomplishment must include type and details'),
  body('socialMediaLinks')
    .isObject()
    .withMessage('Social media links must be an object')
    .custom((links) => {
      const validKeys = ['instagram', 'tiktok', 'strava', 'youtube'];
      return Object.keys(links).every((key) => validKeys.includes(key));
    })
    .withMessage('Invalid social media links structure'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

module.exports = { validateProfileUpdate };
