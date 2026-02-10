const asyncHandler = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next);
    } catch (error) {
        // In Express v5, async errors are auto-forwarded.
        // If next is available, use it; otherwise rethrow.
        if (typeof next === "function") {
            next(error);
        } else {
            throw error;
        }
    }
};

export default asyncHandler;