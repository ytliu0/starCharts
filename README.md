# Star Charts

This package contains two HTML pages [local star charts](https://ytliu0.github.io/starCharts/index.html) and [equatorial star charts](https://ytliu0.github.io/starCharts/chartGCRS_min.html). 

The [local star charts](https://ytliu0.github.io/starCharts/index.html) webpage uses the computer's clock to obtain the current local time and then uses it to calculate the local sidereal times and plot star charts on two locations. 

The [equatorial star charts](https://ytliu0.github.io/starCharts/chartGCRS_min.html) webpage uses the computer's clock to obtain the current time and plot star charts showing the positions of the Sun, Moon, planets and stars on three star charts based on the equatorial coordinate system associated with J2000.0 mean equator and equinox. 

All calculations are done using JavaScript. The physics and mathematics involved in creating the star charts is explained briefly in this [pdf document](https://ytliu0.github.io/starCharts/docs/star_charts.pdf).

## Files:

- sidereal.html: HTML page for the local star charts. This should be used for code development. Use index.html to optimize performance.
- chartGCRS.html: HTML page for the equatorial star charts. This should be used for code development. Use chartGCRS_min.html to optimize performance.
- Constellations.html: HTML page showing a table of the names and abbreviations of the 88 constellations.
- sidereal.css: style file for both sidereal.html and chartGCRS.html
- sidereal.js: javascript functions for sidereal.html.
- animation.js: javascript functions for handling animations in sidereal.html.
- riseSetTimes.js: javascript functions for calculating the rise, set and upper transit times (used by sidereal.html).
- chartGCRS.js: javascript functions for chartGCRS.html
- brightStars.js: contains data (in JSON) for stars, constellation lines and labels.
- milkyWay.js: contains data (in JSON) for the Milky Way boundary.
- dateAndTime.js: javascript functions used by both sidereal.html and chartGCRS.html. Mostly functions involving Delta T, converting bewteen calendar and Julian date, and other utilities. 
- precession.js: javascript functions for precession and nutation.
- SunMoonPlanets.js: javascript functions for computing the positions of the Sun, Moon, and planets using JPL's formulae and truncated ELP/MPP02 series. It also contains functions that calculate the planet's elongation, phase angle, fraction illuminated, and apparent magnitude. There is a function that calculates the aberration of light. 
- Mercuey.js, Venus.js, Earth.js, Mars.js, Jupiter.js, Saturn.js, Uranus.js, Neptune.js: javascript functions that calculate the heliocentric positions of Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus and Neptune by VSOP87A.
- Sun.js: javascript functions that calculate the barycentric position of the Sun by VSOP87E (not used).
- planetPosVSOP87.js: contains a function that computes the geocentric position of the Sun and planets with light-time correction. The calculation is based on the heliocentric positions of VSOP87A
- MoonElpMpp02DE.js: javascript functions that calculate the position of the Moon based on ELP/MPP02 series. This is a truncated version containing only 3750 terms.
- MoonElpMpp02DEUnabridged.js: javascript functions that calculate the position of the Moon based on ELP/MPP02 series. This is the unabridged version (not used).
- *_min.js: minified version of the .js files.
- index.html: same as sidereal.html but calls the minified js files.
- chartGCRS_min.html: same as chartGCRS.html but calls the minified js files.
- docs/star_charts.pdf: pdf document describes the physics and mathematics involved in the calculations on the two webpages.
- docs/star_charts.tex: LaTeX file for docs/star_charts.pdf.
- docs/*.jpg: jpg files of the figures in docs/star_charts.pdf.
