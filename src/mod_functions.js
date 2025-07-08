"use strict";

// restrict x to the range [-pi, pi) by subtracting integer multiples of 2 pi.
function mod2pi(x) { 
  return x - 2*Math.PI*Math.floor(0.5*x/Math.PI + 0.5);
}

// Given x and k, calculate q = floor(x/k + 0.5) and r = x - q*k.
// x and k are assumed to be integers.
function quotient_remainder(x, k) {
  let q = Math.floor(x/k + 0.5);
  let r = x - q*k;
  return {q:q, r:r};
}

// Calculate mod(omg*(D + f), 2*pi), where D is an integer and omg < 2*pi.
// This calculation takes into account the integer nature of D to prevent the
// loss of precision caused by truncation error.
function mod2pi_omgDf(omg, D, f) {
  let tpi = 2*Math.PI;
  let x = omg*f, ph = omg*D, omg1 = omg, qD=D, rD=0;
  while (Math.abs(ph) > tpi) {
    let p = Math.abs(tpi/omg1) + 0.5;
    let k = Math.floor(p);
    let qr = quotient_remainder(qD, k);
    qD = qr.q; rD = qr.r;
    x += omg1*rD;
    omg1 *= (k - p + 0.5);
    ph = omg1*qD;
  }
  return mod2pi(x + ph);
}