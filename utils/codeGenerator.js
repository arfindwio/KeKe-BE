module.exports = {
  generatedPaymentCode: () => {
    const characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    let code = "";
    for (let i = 1; i <= 12; i++) {
      code += characters[Math.floor(Math.random() * characters.length)];
    }
    return code;
  },
};
