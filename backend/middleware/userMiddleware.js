// const jwt = require("jsonwebtoken");
import jwt from "jsonwebtoken";

const userMiddlware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(400).json({
                message: "Authorization header missing or invalid",
            });
        }

        const token = authHeader.split(" ")[1];

        const decodedData = jwt.verify(token, process.env.JWT_USER_SECRET);
        if (decodedData) {
            req.userId = decodedData.id;
            next();
        } else {
            res.status(401).json({
                statusText: "fail",
                message: "Unauthorized"
            })
        }

    } catch (error) {
        console.log(error);
        res.json({ error });
    }
}

export default userMiddlware;