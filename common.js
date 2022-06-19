const constants = Object.freeze({
  maximumContentLength: 2217,
  maximumNumberOfBoards: 10_000_000,
  protocolVersion: '83',
  contentType: 'text/html;charset=utf-8',
  authorizationPreamble: 'Spring-83 Signature',
  keyMatchRegex: /83e(0[1-9]|1[0-2])(\d\d)$/,
  unmodifiedSinceTimeFudgeMs: 6000,
  boardTTLDays: 22,
  getKeySecurityPolicies: {
    none: ['script-src', 'script-src-attr', 'script-src-elem',
      'child-src', 'frame-src', 'prefetch-src', ' object-src', 'font-src'],
    'data:': ['img-src']
  },
  headerNames: {
    difficulty: 'spring-difficulty',
    signature: 'spring-signature',
    version: 'spring-version'
  },
  rootTemplateName: 'root.tmpl.html',
  defaultContentPath: '.content',
  defaultFQDN: 'example.com',
  strictVerification: true,
  maxKey64: (2 ** 64 - 1),
  ttlCheckFreqMinutes: 11
});

// 'strict' only allows keys that are usable *now* to match
function pubKeyHexIsValid (pubKeyHex, strict = false) {
  const match = pubKeyHex.match(constants.keyMatchRegex);

  if (match && match.length === 3) {
    const monthDigits = Number.parseInt(match[1]);
    const lastTwoDigitsNum = Number.parseInt(match[2]);

    if (Number.isNaN(monthDigits) || Number.isNaN(lastTwoDigitsNum)) {
      return false;
    }

    let today = Date.now();
    let expiry = new Date(`${lastTwoDigitsNum}-${monthDigits}-1`); // node should do the right thing, even with a two digit year
    expiry.setMonth(expiry.getMonth() + 1);
    let twoYearsFromNow = new Date(new Date().setFullYear(new Date().getFullYear() + 2))
    
    if(today >= expiry){
      return false;
    }

    if(expiry > twoYearsFromNow) {
      return false;
    }

    return true;
  }

  return false;
}

function signatureFromAuthorization (v) {
  if (v.indexOf('=') === -1) {
    return null;
  }

  const [preamble, sigHex] = v.split('=');

  if (preamble !== constants.authorizationPreamble) {
    return null;
  }

  return sigHex;
}

function getCurrentDifficultyFactor (knownKeys) {
  return (Object.keys(knownKeys).length / constants.maximumNumberOfBoards) ** 4;
}

module.exports = {
  constants,

  pubKeyIsValid: (pubKeyData, strict = false) => pubKeyHexIsValid(Buffer.from(pubKeyData).toString('hex'), strict),
  pubKeyHexIsValid,

  signatureFromAuthorization,

  getCurrentDifficultyFactor,
  keyIsUnderDifficultyThreshold: (pubKeyHex, knownKeys) =>
    Buffer.from(pubKeyHex, 'hex').readBigInt64BE() < BigInt(constants.maxKey64 * (1.0 - getCurrentDifficultyFactor(knownKeys))),

  normalizedZeroBoardKeyDifficultyFactor: (pubKeyHex) =>
    Buffer.from(pubKeyHex, 'hex').readBigInt64BE() / BigInt(constants.maxKey64 * (1.0 - getCurrentDifficultyFactor({})))
};
