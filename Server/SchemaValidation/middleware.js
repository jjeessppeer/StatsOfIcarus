const schemaMiddleware = (schema, property) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        const valid = error == null;

        if (valid) {
            next();
        }
        else {
            res.status(400).send();
        }
    }
}

module.exports = schemaMiddleware;