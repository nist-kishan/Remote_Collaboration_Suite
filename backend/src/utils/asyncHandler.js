export const asyncHandle = (asyncFunction) => (req, res, next) => {
    return Promise.resolve(asyncFunction(req, res, next)).catch(next);
};

// Also export as asyncHandler for backward compatibility
export const asyncHandler = asyncHandle;