const crypto = require('crypto');

class Crypto {
  static randomString(size) {
    return crypto.randomBytes(Math.ceil(size / 2))
      .toString('hex')
      .slice(0, size);
  }

  static passwordHash(pass, salt) {
    const hash = crypto.createHmac('SHA3-512', salt);
    hash.update(pass);
    return hash.digest('hex');
  }
}

module.exports = { Crypto };
