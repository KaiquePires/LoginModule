import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import UserRepository from "../repository/UserRepository.js";
import Exception from "../../../constants/Exception.js";
import * as httpStatus from "../../../constants/httpStatus.js";
import * as secrets from "../../../constants/secrets.js";

class UserService {
    async findByEmail(req) {
        try {
            const {
                email
            } = req.params;
            const {
                authUser
            } = req;
            this.validateRequestData(email);
            let user = await UserRepository.findByEmail(email);
            this.validateUserNotFound(user);
            this.validadeAuthenticatedUser(user, authUser);
            return {
                status: httpStatus.SUCESS,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                },
            };
        } catch (err) {
            return {
                status: err.status ? err.status : httpStatus.INTERNAL_SERVER_ERROR,
                message: err.message,
            };
        };
    };

    validateRequestData(email) {
        if (!email) {
            throw new Exception(httpStatus.BAD_REQUEST, "User email was not informed. ");
        };
    };

    validateUserNotFound(user) {
        if (!user) {
            throw new Exception(httpStatus.BAD_REQUEST, "User was not found.");
        };
    };

    validadeAuthenticatedUser(user, authUser) {
        if (!authUser || user.id !== authUser.id) {
            throw new Exception(httpStatus.FORBIDDEN, "You cannot see this user data.");
        };
    };

    async getAccessToken(req) {
        try {
            const {
                email,
                password
            } = req.body;
            this.validateAccessTokenData(email, password);
            let user = await UserRepository.findByEmail(email);
            this.validateUserNotFound(user);
            //await this.validatePassword(password, user.password);
            const authUser = {
                id: user.id,
                name: user.name,
                password: user.password
            };
            const accessToken = jwt.sign({
                authUser
            }, secrets.API_SECRET, {
                expiresIn: "1d"
            });
            return {
                status: httpStatus.SUCESS,
                accessToken,
            };
        } catch (err) {
            return {
                status: err.status ? err.status : httpStatus.INTERNAL_SERVER_ERROR,
                message: err.message,
            };
        };
    };

    validateAccessTokenData(email, password) {
        if (!email || !password) {
            throw new Exception(httpStatus.UNAUTHORIZED, "Email and password must be informed");
        };
    };

    async validatePassword(password, hashPassword) {
        if (!await bcrypt.compare(password, hashPassword)) {
            throw new Exception(httpStatus.UNAUTHORIZED, "Password doesn't match.");
        };
    };
};

export default new UserService();