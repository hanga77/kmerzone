import { body, validationResult } from 'express-validator';

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

export const registerValidation = [
    body('name', 'Name is required').not().isEmpty().trim().escape(),
    body('email', 'Please include a valid email').isEmail().normalizeEmail(),
    body('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
    handleValidationErrors,
];

export const loginValidation = [
    body('email', 'Please include a valid email').isEmail().normalizeEmail(),
    body('password', 'Password is required').exists(),
    handleValidationErrors,
];

export const addressValidation = [
    body('fullName', 'Full name is required').not().isEmpty().trim().escape(),
    body('phone', 'Phone number is required').not().isEmpty().trim().escape(),
    body('address', 'Address is required').not().isEmpty().trim().escape(),
    body('city', 'City is required').not().isEmpty().trim().escape(),
    handleValidationErrors,
];

export const productValidation = [
    body('name', 'Product name is required').not().isEmpty().trim().escape(),
    body('price', 'Price must be a valid number').isFloat({ gt: 0 }),
    body('stock', 'Stock must be a valid number').isInt({ gt: -1 }),
    body('categoryId', 'Category is required').isMongoId(),
    body('description', 'Description is required').not().isEmpty().trim().escape(),
    handleValidationErrors,
];