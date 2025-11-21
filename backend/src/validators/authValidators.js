const Joi = require('joi');

/**
 * Customer registration validation schema
 */
const registerCustomerSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(100)
        .trim()
        .required()
        .messages({
            'string.empty': 'Name is required',
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 100 characters',
            'any.required': 'Name is required'
        }),

    email: Joi.string()
        .email()
        .lowercase()
        .trim()
        .required()
        .messages({
            'string.empty': 'Email is required',
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        }),

    password: Joi.string()
        .min(8)
        .max(128)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .required()
        .messages({
            'string.empty': 'Password is required',
            'string.min': 'Password must be at least 8 characters long',
            'string.max': 'Password cannot exceed 128 characters',
            'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
            'any.required': 'Password is required'
        }),

    nid_number: Joi.string()
        .pattern(/^\d{10}$|^\d{13}$|^\d{17}$/)
        .required()
        .messages({
            'string.empty': 'NID number is required',
            'string.pattern.base': 'NID number must be 10, 13, or 17 digits',
            'any.required': 'NID number is required'
        })
});

/**
 * Bank officer registration validation schema
 */
const registerBankOfficerSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(100)
        .trim()
        .required()
        .messages({
            'string.empty': 'Name is required',
            'string.min': 'Name must be at least 2 characters long',
            'string.max': 'Name cannot exceed 100 characters',
            'any.required': 'Name is required'
        }),

    email: Joi.string()
        .email()
        .lowercase()
        .trim()
        .required()
        .messages({
            'string.empty': 'Email is required',
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        }),

    password: Joi.string()
        .min(8)
        .max(128)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .required()
        .messages({
            'string.empty': 'Password is required',
            'string.min': 'Password must be at least 8 characters long',
            'string.max': 'Password cannot exceed 128 characters',
            'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
            'any.required': 'Password is required'
        }),

    bank_id: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.empty': 'Bank ID is required',
            'string.pattern.base': 'Invalid Bank ID format',
            'any.required': 'Bank ID is required'
        }),

    officer_id: Joi.string()
        .min(3)
        .max(50)
        .alphanum()
        .required()
        .messages({
            'string.empty': 'Officer ID is required',
            'string.min': 'Officer ID must be at least 3 characters long',
            'string.max': 'Officer ID cannot exceed 50 characters',
            'string.alphanum': 'Officer ID must contain only alphanumeric characters',
            'any.required': 'Officer ID is required'
        })
});

/**
 * Login validation schema
 */
const loginSchema = Joi.object({
    email: Joi.string()
        .email()
        .lowercase()
        .trim()
        .required()
        .messages({
            'string.empty': 'Email is required',
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        }),

    password: Joi.string()
        .required()
        .messages({
            'string.empty': 'Password is required',
            'any.required': 'Password is required'
        })
});

/**
 * Refresh token validation schema
 */
const refreshTokenSchema = Joi.object({
    refreshToken: Joi.string()
        .required()
        .messages({
            'string.empty': 'Refresh token is required',
            'any.required': 'Refresh token is required'
        })
});

module.exports = {
    registerCustomerSchema,
    registerBankOfficerSchema,
    loginSchema,
    refreshTokenSchema
};
