const Joi = require('joi');

/**
 * KYC submission validation schema
 */
const submitKycSchema = Joi.object({
    // Credential sharing option
    useExistingCredential: Joi.boolean()
        .default(false)
        .messages({
            'boolean.base': 'useExistingCredential must be a boolean'
        }),

    sharedCredentialId: Joi.string()
        .when('useExistingCredential', {
            is: true,
            then: Joi.required(),
            otherwise: Joi.optional()
        })
        .messages({
            'string.empty': 'Credential ID is required when using existing credential',
            'any.required': 'Credential ID is required when using existing credential'
        }),

    // Bank selection
    bankId: Joi.string()
        .optional()
        .messages({
            'string.empty': 'Bank ID cannot be empty'
        }),

    // Traditional KYC fields (required only when NOT using existing credential)
    nid_number: Joi.string()
        .pattern(/^\d{10}$|^\d{13}$|^\d{17}$/)
        .when('useExistingCredential', {
            is: false,
            then: Joi.required(),
            otherwise: Joi.optional()
        })
        .messages({
            'string.empty': 'NID number is required',
            'string.pattern.base': 'NID number must be 10, 13, or 17 digits',
            'any.required': 'NID number is required'
        }),

    full_name: Joi.string()
        .min(2)
        .max(100)
        .trim()
        .when('useExistingCredential', {
            is: false,
            then: Joi.required(),
            otherwise: Joi.optional()
        })
        .messages({
            'string.empty': 'Full name is required',
            'string.min': 'Full name must be at least 2 characters long',
            'string.max': 'Full name cannot exceed 100 characters',
            'any.required': 'Full name is required'
        }),

    date_of_birth: Joi.date()
        .iso()
        .max('now')
        .when('useExistingCredential', {
            is: false,
            then: Joi.required(),
            otherwise: Joi.optional()
        })
        .messages({
            'date.base': 'Date of birth must be a valid date',
            'date.max': 'Date of birth cannot be in the future',
            'any.required': 'Date of birth is required'
        }),

    address: Joi.string()
        .min(10)
        .max(500)
        .trim()
        .when('useExistingCredential', {
            is: false,
            then: Joi.required(),
            otherwise: Joi.optional()
        })
        .messages({
            'string.empty': 'Address is required',
            'string.min': 'Address must be at least 10 characters long',
            'string.max': 'Address cannot exceed 500 characters',
            'any.required': 'Address is required'
        }),

    father_name: Joi.string()
        .min(2)
        .max(100)
        .trim()
        .optional()
        .messages({
            'string.min': 'Father name must be at least 2 characters long',
            'string.max': 'Father name cannot exceed 100 characters'
        }),

    mother_name: Joi.string()
        .min(2)
        .max(100)
        .trim()
        .optional()
        .messages({
            'string.min': 'Mother name must be at least 2 characters long',
            'string.max': 'Mother name cannot exceed 100 characters'
        }),

    phone: Joi.string()
        .pattern(/^(\+880|880|0)?1[3-9]\d{8}$/)
        .optional()
        .messages({
            'string.pattern.base': 'Invalid Bangladesh phone number format'
        })
});

/**
 * Pagination validation schema
 */
const paginationSchema = Joi.object({
    page: Joi.number()
        .integer()
        .min(1)
        .default(1)
        .messages({
            'number.base': 'Page must be a number',
            'number.integer': 'Page must be an integer',
            'number.min': 'Page must be at least 1'
        }),

    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(10)
        .messages({
            'number.base': 'Limit must be a number',
            'number.integer': 'Limit must be an integer',
            'number.min': 'Limit must be at least 1',
            'number.max': 'Limit cannot exceed 100'
        }),
    
    status: Joi.string()
        .valid('draft', 'submitted', 'pending', 'under_review', 'approved', 'rejected')
        .optional()
        .messages({
            'string.base': 'Status must be a string',
            'any.only': 'Status must be one of: draft, submitted, pending, under_review, approved, rejected'
        })
}).unknown(false);

/**
 * Credential filter validation schema
 */
const credentialFilterSchema = Joi.object({
    status: Joi.string()
        .valid('active', 'revoked', 'all')
        .default('all')
        .messages({
            'string.base': 'Status must be a string',
            'any.only': 'Status must be one of: active, revoked, all'
        }),

    page: Joi.number()
        .integer()
        .min(1)
        .default(1)
        .optional(),

    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(10)
        .optional()
});

/**
 * MongoDB ObjectId validation schema
 */
const objectIdSchema = Joi.object({
    requestId: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid request ID format',
            'any.required': 'Request ID is required'
        })
});

module.exports = {
    submitKycSchema,
    paginationSchema,
    credentialFilterSchema,
    objectIdSchema
};
