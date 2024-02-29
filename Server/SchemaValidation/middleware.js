

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

const queryValidator = (schema) => {
    return (req, res, next) => {
        const validation = schema.validate(req.query);
        if (validation.error) {
            console.log("error.");
            return res.status(400).send();
        }
        next();
    }
}

const bodyValidator = (schema) => {
    return (req, res, next) => {
        const validation = schema.validate(req.body);
        if (validation.error) {
            return res.status(400).send();
        }
        next();
    }
}

module.exports = {
    schemaMiddleware,
    queryValidator,
    bodyValidator
};