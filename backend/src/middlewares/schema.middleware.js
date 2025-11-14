import { userSchema } from "../joiSchema/joiSchema";
import { ApiError } from "../utils/ApiError";

function userValidation(req, res, next) {
    let { error } = userSchema.validate(req.body);
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        return next(new ApiError(400, errMsg));
    } else { next() };
};