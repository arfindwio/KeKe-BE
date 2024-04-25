const midtransClient = require("midtrans-client");
const axios = require("axios");

const prisma = require("../libs/prismaClient");
const nodemailer = require("../utils/nodemailer");
const { formattedDate } = require("../utils/formattedDate");
const { generatedPaymentCode } = require("../utils/codeGenerator");
const catchAsync = require("../utils/catchAsync");
const { CustomError } = require("../utils/errorHandler");
const { getPagination } = require("../utils/getPagination");

const { PAYMENT_DEV_CLIENT_KEY, PAYMENT_DEV_SERVER_KEY, PAYMENT_PROD_CLIENT_KEY, PAYMENT_PROD_SERVER_KEY, FRONTEND_URL } = process.env;

// Setting the environment (true for production, false for development)
const isProduction = false;

// Initializing Midtrans CoreApi with appropriate keys based on the environment
let core = new midtransClient.CoreApi({
  // Set to true if you want Production Environment (accept real transaction).
  isProduction: isProduction,
  serverKey: isProduction ? PAYMENT_PROD_SERVER_KEY : PAYMENT_DEV_SERVER_KEY,
  clientKey: isProduction ? PAYMENT_PROD_CLIENT_KEY : PAYMENT_DEV_CLIENT_KEY,
});

module.exports = {
  getAllPayments: catchAsync(async (req, res, next) => {
    try {
      const { search, page = 1, limit = 10 } = req.query;

      const payments = await prisma.payment.findMany({
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        where: search ? { cart: { product: { productName: { contains: search, mode: "insensitive" } } } } : {},
        include: {
          cart: {
            select: {
              note: true,
              product: {
                select: {
                  productName: true,
                  color: true,
                  size: true,
                },
              },
            },
          },
        },
      });

      const totalPayments = await prisma.payment.count({
        where: search ? { cart: { product: { productName: { contains: search, mode: "insensitive" } } } } : {},
      });

      const pagination = getPagination(req, totalPayments, Number(page), Number(limit));

      res.status(200).json({
        status: true,
        message: "Get all payment history successful",
        data: { pagination, payments },
      });
    } catch (err) {
      next(err);
    }
  }),

  getPaymentsHistory: catchAsync(async (req, res, next) => {
    try {
      const { search, page = 1, limit = 10 } = req.query;

      const payments = await prisma.payment.findMany({
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        where: search ? { cart: { product: { productName: { contains: search, mode: "insensitive" } } }, userId: Number(req.user.id) } : { userId: Number(req.user.id) },
        include: {
          cart: {
            select: {
              note: true,
              product: {
                select: {
                  productName: true,
                  color: true,
                  size: true,
                },
              },
            },
          },
        },
      });

      const totalPayments = await prisma.payment.count({
        where: search ? { cart: { product: { productName: { contains: search, mode: "insensitive" } } }, userId: Number(req.user.id) } : { userId: Number(req.user.id) },
      });

      const pagination = getPagination(req, totalPayments, Number(page), Number(limit));

      res.status(200).json({
        status: true,
        message: "Get all payment history successful",
        data: { pagination, payments },
      });
    } catch (err) {
      next(err);
    }
  }),

  createPaymentMidtrans: catchAsync(async (req, res, next) => {
    try {
      const { methodPayment, cardNumber, cvv, expiryDate, bankName, store, message } = req.body;

      // Extract month and year from expiryDate
      let month = expiryDate.slice(0, 2);
      let year = expiryDate.slice(3);

      // Set the Midtrans API URL based on the environment
      const apiUrl = isProduction ? `https://api.midtrans.com/v2/token?client_key=${PAYMENT_PROD_CLIENT_KEY}` : `https://api.sandbox.midtrans.com/v2/token?client_key=${PAYMENT_DEV_CLIENT_KEY}`;

      // Get card token from Midtrans API
      const response = await axios.get(`${apiUrl}&card_number=${cardNumber}&card_cvv=${cvv}&card_exp_month=${month}&card_exp_year=${`20${year}`}`);

      const token_id = response.data.token_id;

      const user = await prisma.user.findUnique({
        where: { id: Number(req.user.id) },
        include: {
          userProfile: true,
        },
      });

      const carts = await prisma.cart.findMany({
        where: { userId: Number(req.user.id), paymentId: null },
        include: {
          product: {
            select: {
              price: true,
            },
          },
        },
      });

      console.log(carts);

      let totalPrice = 0;

      for (const cart of carts) {
        totalPrice += cart.quantity * cart.product.price;
      }

      const paymentCodeOrder = generatedPaymentCode();

      // Create a new payment record in the database
      let newPayment = await prisma.payment.create({
        data: {
          amount: totalPrice,
          paymentStatus: "Paid",
          methodPayment,
          paymentCode: paymentCodeOrder,
          userId: Number(req.user.id),
          createdAt: formattedDate(new Date()),
          updatedAt: formattedDate(new Date()),
        },
      });

      // Define payment parameters for Midtrans API
      let parameter = {
        transaction_details: {
          order_id: paymentCodeOrder,
          gross_amount: parseInt(totalPrice),
        },
        customer_details: {
          first_name: user.userProfile.fullName,
          email: user.email,
          phone: user.userProfile.phoneNumber,
        },
      };

      // Set payment type based on the methodPayment
      if (methodPayment === "Credit Card") {
        if (!cardNumber || !cvv || !expiryDate || bankName !== undefined || store !== undefined || message !== undefined) {
          throw new CustomError(400, "For Credit Card payments, please provide only card details (cardNumber, cvv, expiryDate). Other fields are not applicable.");
        }

        parameter.payment_type = "credit_card";
        parameter.credit_card = {
          token_id: token_id,
          authentication: true,
        };
      }

      if (methodPayment === "Bank Transfer") {
        if (!bankName || cardNumber !== undefined || cvv !== undefined || expiryDate !== undefined || store !== undefined || message !== undefined) {
          throw new CustomError(400, "For this payment method, please provide only the required fields. Unnecessary fields are not applicable.");
        }

        parameter.payment_type = "bank_transfer";
        parameter.bank_transfer = {
          bank: bankName,
        };
      }

      if (methodPayment === "Mandiri Bill") {
        if (bankName !== undefined || cardNumber !== undefined || cvv !== undefined || expiryDate !== undefined || store !== undefined || message !== undefined) {
          throw new CustomError(400, "For this payment method, please provide only the required card details (cardNumber, cvv, expiryDate). Other fields are not applicable.");
        }

        parameter.payment_type = "echannel";
        parameter.echannel = {
          bill_info1: "Payment:",
          bill_info2: "Online purchase",
        };
      }

      if (methodPayment === "Permata") {
        if (bankName !== undefined || cardNumber !== undefined || cvv !== undefined || expiryDate !== undefined || store !== undefined || message !== undefined) {
          throw new CustomError(400, "For this payment method, please provide only the required card details (cardNumber, cvv, expiryDate). Other fields are not applicable.");
        }

        parameter.payment_type = "permata";
      }

      if (methodPayment === "Gopay") {
        if (bankName !== undefined || cardNumber !== undefined || cvv !== undefined || expiryDate !== undefined || store !== undefined || message !== undefined) {
          throw new CustomError(400, "For this payment method, please provide only the required card details (cardNumber, cvv, expiryDate). Other fields are not applicable.");
        }

        parameter.payment_type = "gopay";
        parameter.gopay = {
          enable_callback: true,
          callback_url: `${FRONTEND_URL}/payment-success`,
        };
      }

      if (methodPayment === "Counter") {
        if (bankName !== undefined || cardNumber !== undefined || cvv !== undefined || expiryDate !== undefined || !store || !message) {
          throw new CustomError(400, "Please provide only the required card details (cardNumber, cvv, expiryDate) for this payment method. Other fields are not applicable.");
        }

        parameter.payment_type = "cstore";
        if (store === "alfamart") {
          parameter.cstore = {
            store: "alfamart",
            message,
            alfamart_free_text_1: "1st row of receipt,",
            alfamart_free_text_2: "This is the 2nd row,",
            alfamart_free_text_3: "3rd row. The end.",
          };
        }

        if (store === "indomaret") {
          parameter.cstore = {
            store: "indomaret",
            message,
          };
        }
      }

      if (methodPayment === "Cardless Credit") {
        if (bankName !== undefined || cardNumber !== undefined || cvv !== undefined || expiryDate !== undefined || store !== undefined || message !== undefined) {
          throw new CustomError(400, "For this payment method, please provide only the required card details (cardNumber, cvv, expiryDate). Other fields are not applicable.");
        }

        parameter.payment_type = "akulaku";
      }

      //   Charge the transaction using Midtrans API
      let transaction = await core.charge(parameter);

      //   Send email notification to the user
      const html = await nodemailer.getHtml("transaction-success.ejs", {
        methodPayment,
      });
      await nodemailer.sendEmail(user.email, "Email Transaction", html);

      await prisma.notification.create({
        data: {
          title: "Notification",
          message: "You have successfully payment Keke Apparel",
          userId: Number(req.user.id),
          createdAt: formattedDate(new Date()),
          updatedAt: formattedDate(new Date()),
        },
      });

      await prisma.cart.updateMany({
        where: { userId: Number(req.user.id), paymentId: null },
        data: {
          paymentId: newPayment.id,
        },
      });

      res.status(201).json({
        status: true,
        message: "Payment initiated successfully",
        data: {
          newPayment,
          transaction,
        },
      });
    } catch (err) {
      next(err);
    }
  }),

  editPayment: catchAsync(async (req, res, next) => {
    try {
      const { paymentId } = req.params;
      const { trackingNumber } = req.body;

      const payment = await prisma.payment.findUnique({
        where: { id: Number(paymentId) },
      });

      if (!payment) throw new CustomError(404, "payment Not Found");

      const editedPayment = await prisma.payment.update({
        where: { id: Number(payment.id) },
        data: {
          trackingNumber,
          deliveryStatus: trackingNumber ? "Shipped" : "Not Shipped",
        },
      });

      res.status(200).json({
        status: true,
        message: "Payment initiated successfully",
        data: {
          editedPayment,
        },
      });
    } catch (err) {
      next(err);
    }
  }),
};
