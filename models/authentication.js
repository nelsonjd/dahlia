exports.authorizeContext = (context) => {
    if (!context.user)
    {
        throw new Error('no token found');
    }
};