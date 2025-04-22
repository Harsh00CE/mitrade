import cryptoRoutes from "./cryptoRoutes.routes.js";
import signUpRoutes from "./signup.routes.js";
import logInRoutes from "./login.routes.js";
import bodyParser from "body-parser";
import verifyCodeRoutes from "./verify-code.routes.js";
import adminRoutes from "./admin.routes.js";
import buyRoutes from "./buy.routes.js";
import getInfo from "./getInfo.routes.js";
import getUserWallet from "./getWallet.routes.js";
import favoriteTokensRouter from "./favorite.routes.js"
import getUserOrders from "./order.routes.js"
import sellRoutes from "./sell.routes.js"
import alertRouter from "./alert.routes.js"
import closeOrderRouter from "./closeOrder.routes.js"
import orderHistoryRouter from "./orderHistory.routes.js"
import liquidationRouter from "./liquidation.routes.js"
import getFavoriteRouter from "./getFavorite.routes.js"
import getChartRouter from "./getChart.routes.js"
import sendAlertsRouter from "./sendEmailAlert.routes.js"
import getUsersRouter from "./getUsers.routes.js"
import configWallet from "./configWallet.routes.js"
import kycRoutes from "./KYC.routes.js";
import forgorPasswordRoutes from "./forgotPassword.routes.js"
import updartePasswordRoutes from "./updatePassword.routes.js"
import adminAuthLogin from "./adminAuthLogin.routes.js"
import adminAuthRegister from "./adminAuthRegister.routes.js"
import depositRoutes from "./deposit.routes.js"
import withdrawRoutes from "./withdraw.routes.js"
import countryNames from "./countries.routes.js";
import adminAccountDetailsRouter from "./adminAccountDetails.routes.js";
import getActiveWalletRouter from "./getActiveAcount.routes.js";
import marketRoute from "./market.routes.js"

export {
    cryptoRoutes,
    signUpRoutes,
    logInRoutes,
    bodyParser,
    verifyCodeRoutes,
    adminRoutes,
    buyRoutes,
    getInfo,
    getUserWallet,
    favoriteTokensRouter,
    getUserOrders,
    sellRoutes,
    alertRouter,
    closeOrderRouter,
    orderHistoryRouter,
    liquidationRouter,
    getFavoriteRouter,
    getChartRouter,
    sendAlertsRouter,    
    getUsersRouter,
    configWallet,
    kycRoutes,
    forgorPasswordRoutes,
    updartePasswordRoutes,
    adminAuthLogin,
    adminAuthRegister,
    depositRoutes,
    withdrawRoutes,
    countryNames,
    adminAccountDetailsRouter,
    getActiveWalletRouter,
    marketRoute
}