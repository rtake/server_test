exports.logMiddleware = (req, res, next) => {
    console.log(Date.now(), req.method, req.url);
    next();
}