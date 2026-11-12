/**
 * Send standardized Joi validation error response.
 */
const sendValidationError = (res, error) => {
    return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map((detail) => ({
            field: detail.path.join('.'),
            message: detail.message
        }))
    });
};

module.exports = { sendValidationError };
