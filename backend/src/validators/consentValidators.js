const Joi = require('joi');

/**
 * Create consent validation schema
 */
const createConsentSchema = Joi.object({
    kycRequestId: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid KYC request ID format',
            'string.empty': 'KYC request ID is required',
            'any.required': 'KYC request ID is required'
        }),

    consentType: Joi.string()
        .valid(
            'data_collection',
            'data_processing',
            'data_sharing',
            'blockchain_storage',
            'biometric_collection',
            'credit_check',
            'background_check',
            'all'
        )
        .required()
        .messages({
            'any.only': 'Invalid consent type',
            'any.required': 'Consent type is required'
        }),

    purpose: Joi.string()
        .min(10)
        .max(500)
        .required()
        .messages({
            'string.empty': 'Purpose is required',
            'string.min': 'Purpose must be at least 10 characters',
            'string.max': 'Purpose cannot exceed 500 characters',
            'any.required': 'Purpose is required'
        }),

    duration: Joi.number()
        .integer()
        .min(1)
        .max(3650)
        .default(365)
        .optional()
        .messages({
            'number.base': 'Duration must be a number',
            'number.integer': 'Duration must be an integer',
            'number.min': 'Duration must be at least 1 day',
            'number.max': 'Duration cannot exceed 3650 days (10 years)'
        }),

    dataCategories: Joi.array()
        .items(
            Joi.string().valid(
                'personal_info',
                'contact_info',
                'identification',
                'biometric',
                'financial',
                'employment',
                'education',
                'medical',
                'criminal_record'
            )
        )
        .optional()
        .messages({
            'array.base': 'Data categories must be an array'
        }),

    thirdParties: Joi.array()
        .items(
            Joi.object({
                name: Joi.string().required(),
                purpose: Joi.string().optional(),
                dataCategories: Joi.array().items(Joi.string()).optional()
            })
        )
        .optional()
        .messages({
            'array.base': 'Third parties must be an array'
        }),

    isMandatory: Joi.boolean()
        .default(false)
        .optional()
});

/**
 * Grant consent validation schema
 */
const grantConsentSchema = Joi.object({
    agreed: Joi.boolean()
        .valid(true)
        .required()
        .messages({
            'any.only': 'You must agree to grant consent',
            'any.required': 'Agreement is required'
        }),

    ipAddress: Joi.string()
        .ip()
        .optional()
        .messages({
            'string.ip': 'Invalid IP address format'
        }),

    userAgent: Joi.string()
        .optional()
});

/**
 * Revoke consent validation schema
 */
const revokeConsentSchema = Joi.object({
    reason: Joi.string()
        .min(10)
        .max(500)
        .required()
        .messages({
            'string.empty': 'Reason for revocation is required',
            'string.min': 'Reason must be at least 10 characters',
            'string.max': 'Reason cannot exceed 500 characters',
            'any.required': 'Reason is required'
        })
});

/**
 * Bulk grant consent validation schema
 */
const bulkGrantConsentSchema = Joi.object({
    consentIds: Joi.array()
        .items(
            Joi.string().pattern(/^[0-9a-fA-F]{24}$/)
        )
        .min(1)
        .required()
        .messages({
            'array.base': 'Consent IDs must be an array',
            'array.min': 'At least one consent ID is required',
            'any.required': 'Consent IDs are required'
        }),

    agreed: Joi.boolean()
        .valid(true)
        .required()
        .messages({
            'any.only': 'You must agree to grant all consents',
            'any.required': 'Agreement is required'
        }),

    ipAddress: Joi.string()
        .ip()
        .optional(),

    userAgent: Joi.string()
        .optional()
});

/**
 * Query consents validation schema
 */
const queryConsentsSchema = Joi.object({
    status: Joi.string()
        .valid('pending', 'granted', 'denied', 'revoked', 'expired', 'all')
        .default('all')
        .optional(),

    consentType: Joi.string()
        .valid(
            'data_collection',
            'data_processing',
            'data_sharing',
            'blockchain_storage',
            'biometric_collection',
            'credit_check',
            'background_check',
            'all'
        )
        .optional(),

    kycRequestId: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .optional(),

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
 * Consent ID validation schema
 */
const consentIdSchema = Joi.object({
    consentId: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid consent ID format',
            'any.required': 'Consent ID is required'
        })
});

module.exports = {
    createConsentSchema,
    grantConsentSchema,
    revokeConsentSchema,
    bulkGrantConsentSchema,
    queryConsentsSchema,
    consentIdSchema
};
