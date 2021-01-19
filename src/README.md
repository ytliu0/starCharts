# Description of Files:

- sidereal.js: javascript functions for index.html.
- animation.js: javascript functions for handling animations in index.html.
- riseSetTimes.js: javascript functions for calculating the rise, set and upper transit times (used by index.html).
- chartGCRS.js: javascript functions for chartGCRS.html
- brightStars.js: contains data (in JSON) for stars, constellation lines and labels.
- milkyWay.js: contains data (in JSON) for the Milky Way boundary.
- dateAndTime.js: javascript functions used by both index.html and chartGCRS.html. Mostly functions involving Delta T, converting bewteen calendar and Julian date, and other utilities.
- precession.js: javascript functions for precession, nutation, and a function that determines the constellation from Ra and Dec.
- SunMoonPlanets.js: javascript functions for computing the positions of the Sun, Moon, and planets using JPL's approximate formulae and truncated ELP/MPP02 series. It also contains functions that calculate the planet's elongation, phase angle, fraction illuminated, and apparent magnitude. There is a function that calculates the aberration of light.
- Mercuey.js, Venus.js, Earth.js, Mars.js, Jupiter.js, Saturn.js, Uranus.js, Neptune.js: javascript functions that calculate the heliocentric positions of Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus and Neptune by VSOP87A.
- Sun.js: javascript functions that calculate the barycentric position of the Sun by VSOP87E (not used).
- planetPosVSOP87.js: contains a function that computes the geocentric position of the Sun and planets with light-time correction. The calculation is based on the heliocentric positions of VSOP87A
- MoonElpMpp02DE.js: javascript functions that calculate the position of the Moon based on ELP/MPP02 series. This is a truncated version containing only 3759 terms.
- MoonElpMpp02DEUnabridged.js: javascript functions that calculate the position of the Moon based on ELP/MPP02 series. This is the unabridged version containing 35901 terms (not used).
