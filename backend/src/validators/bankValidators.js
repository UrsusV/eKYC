const Joi = require('joi');

/**
 * KYC verification validation schema
 */
const verifyKycSchema = Joi.object({
    approved: Joi.boolean()
        .required()
        .messages({
            'boolean.base': 'Approved must be a boolean value',
            'any.required': 'Approved field is required'
        }),

    comments: Joi.string()
        .min(10)
        .max(1000)
        .trim()
        .required()
        .messages({
            'string.empty': 'Comments are required',
            'string.min': 'Comments must be at least 10 characters long',
            'string.max': 'Comments cannot exceed 1000 characters',
            'any.required': 'Comments are required'
        }),

    rejectionCategory: Joi.string()
        .valid(
            'incomplete_documents',
            'invalid_documents',
            'failed_verification',
            'high_risk',
            'aml_concerns',
            'duplicate_account',
            'ineligible',
            'other'
        )
        .when('approved', {
            is: false,
            then: Joi.required(),
            otherwise: Joi.optional()
        })
        .messages({
            'any.only': 'Invalid rejection category',
            'any.required': 'Rejection category is required when rejecting a request'
        })
});

/**
 * Issue credential validation schema
 */
const issueCredentialSchema = Joi.object({
    requestId: Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid request ID format',
            'string.empty': 'Request ID is required',
            'any.required': 'Request ID is required'
        })
});

/**
 * KYC requests list query validation schema
 */
const kycRequestsQuerySchema = Joi.object({
    status: Joi.string()
        .valid(
            'pending',
            'under_review',
            'document_verification',
            'additional_info_required',
            'approved',
            'rejected',
            'all'
        )
        .default('all')
        .optional()
        .messages({
            'any.only': 'Invalid status value'
        }),

    page: Joi.number()
        .integer()
        .min(1)
        .default(1)
        .optional()
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
        .optional()
        .messages({
            'number.base': 'Limit must be a number',
            'number.integer': 'Limit must be an integer',
            'number.min': 'Limit must be at least 1',
            'number.max': 'Limit cannot exceed 100'
        })
});

module.exports = {
    verifyKycSchema,
    issueCredentialSchema,
    kycRequestsQuerySchema
};
