'use strict';

/* #################### *
 * Caches and Globals   *
 * #################### */

// storage for the loaded lexica
;var permaDLex = {};
var permaMLex = {};
var permaTLex = {};
var permaSLex = {};
var prospLex = {};
var affLex = {};
var ageLex = {};
var genderLex = {};
var big5Lex = {};
var darkLex = {};

// keep track of which lexica are loaded into memory
var lexStatus = {
  'dLoaded': false, // is the permaV3_dd lexicon loaded?
  'mLoaded': false, // is the permaV3_manual lexicon loaded?
  'tLoaded': false, // is the permaV3_manual_tsp75 lexicon loaded?
  'sLoaded': false, // is the spanish lexicon loaded?
  'pLoaded': false, // is the prospection lexicon loaded?
  'aLoaded': false, // is the affect lexicon loaded?
  'gLoaded': false, // is the gender lexicon loaded?
  'eLoaded': false, // is the age lexicon loaded?
  '5Loaded': false, // is the big-five lexicon loaded?
  'zLoaded': false, // is the dark triad lexicon loaded?
};

// cache elements
var body = document.getElementsByTagName('BODY')[0];
var prospectCheck = document.getElementById('prospectCheck');
var affectCheck = document.getElementById('affectCheck');
var optimismCheck = document.getElementById('optimismCheck');
var bigFiveCheck = document.getElementById('bigFiveCheck');
var ageCheck = document.getElementById('ageCheck');
var darkTriadCheck = document.getElementById('darkTriadCheck');
var minWeight = document.getElementById('minWeight');
var maxWeight = document.getElementById('maxWeight');
var permaSelect = document.getElementById('permaSelect');

// chart placeholders
var pieChart;
var radarChart;
var fiveChart;
var affChart;

/* #################### *
 * Helpers              *
 * #################### */

/**
 * Get the indexes of duplicate elements in an array
 * @function indexesOf
 * @param  {Array} arr input array
 * @param  {string} el element to test against
 * @return {Array} array of indexes
 */
function indexesOf(arr, el) {
  var idxs = [];
  var i = arr.length;
  while (i--) {
    if (arr[i] === el) {
      idxs.unshift(i);
    }
  }
  return idxs;
}

/**
* Generate a CSV URI from an array
* @function makeCSV
* @param {Array} arr array of tokens
* @return {URI} CSV URI
*/
function makeCSV(arr) {
  if (document.getElementById('alphaCheck').checked) arr.sort();
  var csv = 'data:text/csv;charset=UTF-16LE,';
  var len = arr.length;
  for (var i = 0; i < len; i++) {
    csv += arr[i] + '\n';
  }
  return encodeURI(csv);
}

/* #################### *
 * UI Functions         *
 * #################### */

/**
* Destroy and recreate canvas elements to avoid problems with chart.js
* @function clearCanvases
*/
function clearCanvases() {
  // destroy previous charts.js bits
  if (pieChart) pieChart.destroy();
  if (radarChart) radarChart.destroy();
  if (fiveChart) fiveChart.destroy();
  if (affChart) affChart.destroy();
  // remove and repace canvas elements
  var c = document.getElementsByTagName('canvas');
  var i = c.length;
  while (i--) {
    var x = c[i].parentNode;
    var canvas = document.createElement('canvas');
    canvas.id = c[i].id;
    canvas.width = 400;
    canvas.height = 400;
    canvas.style.width = '400px';
    canvas.style.height = '400px';
    x.removeChild(c[i]);
    x.appendChild(canvas);
  }
}

/**
* Toggles the 'Analyse Optimism' checkbox
* @function optToggle
*/
function optToggle() {
  var optBox = document.getElementById('optBox');
  if (prospectCheck.checked && affectCheck.checked) {
    optimismCheck.disabled = false;
    optBox.classList.remove('disabled');
  } else {
    optimismCheck.disabled = true;
    optimismCheck.checked = false;
    optBox.classList.add('disabled');
  }
}

/**
 * Enable the extra lexica
 * @function enableExtras
 */
function enableExtras() {
  prospectCheck.disabled = false;
  affectCheck.disabled = false;
  bigFiveCheck.disabled = false;
  ageCheck.disabled = false;
}

/**
 * Disable and uncheck extra lexica
 * @function disableExtras
 */
function disableExtras() {
  prospectCheck.checked = false;
  prospectCheck.disabled = true;
  affectCheck.checked = false;
  affectCheck.disabled = true;
  optimismCheck.checked = false; // no need to disable as handled by above
  bigFiveCheck.checked = false;
  bigFiveCheck.disabled = true;
  ageCheck.checked = false;
  ageCheck.disabled = true;
}

/**
 * Set and enable the weight thresholds
 * @function enableWeights
 * @param  {number} min
 * @param  {number} max
 */
function enableWeights(min, max) {
  minWeight.disabled = false;
  maxWeight.disabled = false;
  minWeight.value = min;
  maxWeight.value = max;
  minWeight.min = min;
  maxWeight.max = max;
}

/**
 * Disable the weight thresholds
 * @function disableWeights
 */
function disableWeights() {
  minWeight.disabled = true;
  maxWeight.disabled = true;
}

/* #################### *
 * Main Functions       *
 * #################### */

/**
 * Return an array of n-grams from tokens
 * @function getNgrams
 * @param  {Array} arr array of tokens
 * @param  {Number} n number of grams
 * @return {Array} array of n-grams
 */
function getNgrams(arr, n) {
  var ngrams = [];
  var mainLoop = function(i) {
    var a = [];
    for (var h = 0; h < n; h++) {
      a.push(arr[(i + n) + (h - n)]);
    }
    return a;
  };
  var len = arr.length - n + 1;
  for (var i = 0; i < len; i++) {
    ngrams.push(mainLoop(i));
  }
  return ngrams;
}

/**
 * Convert n-gram chunks back to strings
 * @function ngramConvert
 * @param  {Array} arr
 * @return {Array}
 */
function ngramConvert(arr) {
  var result = [];
  var len = arr.length;
  for (var i = 0; i < len; i++) {
    result.push(arr[i].join(' '));
  }
  return result;
}

/**
* Load JSON files into the relevant lexicon object
* @function loadLexicon
* @param {string} file JSON file name
* @param {Object} obj the global lexicon object
* @param {string} loader relevant lexStatus item e.g. dLoaded
*/
function loadLexicon(file, obj, loader) {
  body.classList.add('loading');

  var request = new XMLHttpRequest();
  request.open('GET', file, true);

  request.onload = function() {
    if (this.status >= 200 && this.status < 400) {
      var lex = JSON.parse(this.response);
      lexStatus[loader] = true;
      var key;
      for (key in lex) {
        if (!lex.hasOwnProperty(key)) continue;
        obj[key] = lex[key];
      }
      body.classList.remove('loading');
    } else {
      window.alert('There was an error loading the lexicon! Please refresh the page and try again.');
      body.classList.remove('loading');
    }
  };

  request.onerror = function() {
    window.alert('There was an error loading the lexicon! Please refresh the page and try again.');
    body.classList.remove('loading');
  };

  request.send();
}

/**
* Tokenise a string into an array
* @function tokenise
* @param {string} str input string
* @return {Array} an array of tokens
*/
function tokenise(str) {
  // adapted from http://wwbp.org/downloads/public_data/happierfuntokenizing.zip
  var reg = new RegExp(/(?:(?:\+?[01][\-\s.]*)?(?:[\(]?\d{3}[\-\s.\)]*)?\d{3}[\-\s.]*\d{4})|(?:[<>]?[:;=8>][\-o\*\']?[\)\]\(\[dDpPxX\/\:\}\{@\|\\]|[\)\]\(\[dDpPxX\/\:\}\{@\|\\][\-o\*\']?[:;=8<][<>]?|<3|\(?\(?\#?\(?\(?\#?[>\-\^\*\+o\~][\_\.\|oO\,][<\-\^\*\+o\~][\#\;]?\)?\)?)|(?:(?:http[s]?\:\/\/)?(?:[\w\_\-]+\.)+(?:com|net|gov|edu|info|org|ly|be|gl|co|gs|pr|me|cc|us|gd|nl|ws|am|im|fm|kr|to|jp|sg))|(?:http[s]?\:\/\/)|(?:\[[a-z_]+\])|(?:\/\w+\?(?:\;?\w+\=\w+)+)|<[^>]+>|(?:@[\w_]+)|(?:\#+[\w_]+[\w\'_\-]*[\w_]+)|(?:[a-z][a-z'\-_]+[a-z])|(?:[+\-]?\d+[,\/.:-]\d+[+\-]?)|(?:[\w_]+)|(?:\.(?:\s*\.){1,})|(?:\S)/, 'gi') // eslint-disable-line
  if (document.getElementById('cleanText').checked) {
    str = he.decode(str); // decode HTML entities
    str.replace(/[^\x00-\x7F]/g, ''); // remove non-ascii characters  
    str = str.replace(/\s\s+/g, ' '); // remove multiple spaces
    str = str.replace(/[\u2018\u2019]/g, '\''); // fix smart apost.
    str = str.replace(/[\u201C\u201D]/g, '"'); // fix smartquotes
    str = str.replace(/[\u2013\u2014]/g, '-'); // fix em-dashes
    str = str.replace(/[\u2026]/g, '...'); // fix ellipses
  }
  return str.match(reg);
}

/**
* @function sortMatches
* @param {Array} arr array to match against lexicon
* @param {Object} obj lexicon object
* @return {Object} object of matches
*/
function sortMatches(arr, obj) {
  var sortedMatches = {'counts': {}};

  // sort out min/max thresholds
  var dd = false; // is the lexicon data-driven?
  var min = Number.NEGATIVE_INFINITY;
  var max = Number.POSITIVE_INFINITY;
  var sel = permaSelect.value;
  if (sel === '1' || sel === '4') {
    dd = true;
    min = parseFloat(minWeight.value);
    max = parseFloat(maxWeight.value);
  }

  for (var cat in obj) {
    if (!obj.hasOwnProperty(cat)) continue;
    var permaCat = (cat.startsWith('POS') || cat.startsWith('NEG'));
    var matches = [];
    var i = 0;
    var data = obj[cat];
    for (var word in data) {
      if (data.hasOwnProperty(word) && arr.indexOf(word) > -1) {
        var weight = data[word];
        if ((permaCat && dd) && (weight < min || weight > max)) continue;
        var match = [];
        var reps = indexesOf(arr, word).length;
        i += reps;
        if (reps > 1) {
          var words = [];
          for (var x = 0; x < reps; x++) {
            words.push(word);
          }
          match.push([words, weight]);
        } else {
          match.push([word, weight]);
        }
        matches.push(match);
      }
    }
    sortedMatches.counts[cat] = i;
    sortedMatches[cat] = matches;
  }
  return sortedMatches;
}

/**
* @function getWords
* @param {Object} obj lexicon matches object
* @param {string} str optional object key to match
* @return {Array} array of words
*/
function getWords(obj, str) {
  var words = [];
  for (var cat in obj) {
    if (obj.hasOwnProperty(cat) && cat.startsWith(str) && cat !== 'counts') {
      var data = obj[cat];
      for (var word in data) {
        if (!data.hasOwnProperty(word)) continue;
        var item = data[word][0][0];
        var len = 0;
        if (Array.isArray(item)) {
          len = item.length;
          item = data[word][0][0][0];
        }
        if (words.indexOf(item) === -1) {
          if (len === 0) {
            words.push(item);
          } else {
            for (var i = 0; i < len; i++) {
              words.push(item);
            }
          }
        }
      }
    }
  }
  return words;
}

/**
* Remove duplicates by appending count to item
* @function handleDuplicates
* @param {Object} obj input object
* @return {Object}
*/
function handleDuplicates(obj) {
  var out = {};
  for (var cat in obj) {
    if (!obj.hasOwnProperty(cat) || cat === 'counts') continue;
    var list = [];
    var data = obj[cat];
    for (var key in data) {
      if (!data.hasOwnProperty(key)) continue;
      var el = data[key][0][0];
      if (Array.isArray(el)) {
        list.push(el[0] + '[' + el.length + ']');
      } else {
        list.push(el);
      }
    }
    // list.sort()
    out[cat] = list;
  }
  return out;
}

/**
* Calculate lexical usage from array
* @function calcLex
* @param {Object} obj lexicon matches to add
* @param {number} wc total word count
* @param {number} int intercept value
* @param {string} enc encoding type
* @return {number} the lexical value
*/
function calcLex(obj, wc, int, enc) {
  // error prevention
  if (!obj) return null;
  if (wc && typeof wc !== 'number') wc = Number(wc);
  if (int && typeof int !== 'number') int = Number(int);
  if (!int) int = 0;

  var lex = 0;
  for (var cat in obj) {
    if (!obj.hasOwnProperty(cat)) continue;
    var word = obj[cat][0][0];
    var weight = obj[cat][0][1];
    var count = 1; // if the word isn't an array it means it appears once only
    if (Array.isArray(word)) count = word.length;
    if (enc === 'freq') {
      lex += (count / wc) * weight;
    } else {
      lex += weight;
    }
  }
  lex += int;
  return lex;
}

/**
 * @function main
 */
function main() {
  // display loading screen
  body.classList.add('loading');

  // get inputted text
  var text = document.getElementById('textInput').value.toString().trim().toLowerCase();

  // check that there is actually text there
  if (text.length === 0) {
    body.classList.remove('loading');
    window.alert('Input box is empty!');
    return;
  }

  // clear all the canvas elements
  clearCanvases();

  // create array of individual words
  var tokens = tokenise(text);

  // get true word count and token count
  var trueCount = text.replace(/\s+/gi, ' ').split(' ').length;
  var wordCount = tokens.length;

  // make the CSV file if selected
  if (document.getElementById('CSVCheck').checked) {
    var csv = makeCSV(tokens);
    var a = document.createElement('a');
    a.setAttribute('href', csv);
    a.setAttribute('download', 'PPTA_Tokens_' + Date.now().toString() + '.csv');
    a.click();
  }

  // Add ngrams after we do CSV
  var ngramSelect = document.getElementById('ngramSelect').value;
  if (ngramSelect === '1' || ngramSelect === '2') {
    var ngrams = [];
    ngrams.push(ngramConvert(getNgrams(tokens, 2)));
    if (ngramSelect === '1') {
      ngrams.push(ngramConvert(getNgrams(tokens, 3)));
    }
    for (var i = 0; i < ngrams.length; i++) {
      tokens = tokens.concat(ngrams[i]);
    }
  }

  // amend token count to include n-grams if requested
  if (document.getElementById('incngram').checked) {
    wordCount = tokens.length;
  }

  // generate our match objects
  var PERMA = {};
  var s = permaSelect.value;
  if (s === '4') {
    PERMA = sortMatches(tokens, permaSLex);
  } else if (s === '2') {
    PERMA = sortMatches(tokens, permaMLex);
  } else if (s === '3') {
    PERMA = sortMatches(tokens, permaTLex);
  } else {
    PERMA = sortMatches(tokens, permaDLex);
  }

  // calculate our important numbers
  PERMA.counts.POS_T = getWords(PERMA, 'POS').length;
  PERMA.counts.NEG_T = getWords(PERMA, 'NEG').length;
  PERMA.counts.TOTAL = getWords(PERMA, '').length;

  // intercept values
  var permaInt = {
    POS_P: 0,
    POS_E: 0,
    POS_R: 0,
    POS_M: 0,
    POS_A: 0,
    NEG_P: 0,
    NEG_E: 0,
    NEG_R: 0,
    NEG_M: 0,
    NEG_A: 0,
  };
  if (s === '4') {
    permaInt = {
      POS_P: 2.675173871,
      POS_E: 2.055179283,
      POS_R: 1.977389757,
      POS_M: 1.738298902,
      POS_A: 3.414517804,
      NEG_P: 2.50468297,
      NEG_E: 1.673629622,
      NEG_R: 1.782788984,
      NEG_M: 1.52890284,
      NEG_A: 2.482131179,
    };
  }

  // calculate lexical values
  var permaLV = {};
  permaLV.POS_P = calcLex(PERMA.POS_P, wordCount, permaInt.POS_P, 'binary');
  permaLV.POS_E = calcLex(PERMA.POS_E, wordCount, permaInt.POS_E, 'binary');
  permaLV.POS_R = calcLex(PERMA.POS_R, wordCount, permaInt.POS_R, 'binary');
  permaLV.POS_M = calcLex(PERMA.POS_M, wordCount, permaInt.POS_M, 'binary');
  permaLV.POS_A = calcLex(PERMA.POS_A, wordCount, permaInt.POS_A, 'binary');
  permaLV.NEG_P = calcLex(PERMA.NEG_P, wordCount, permaInt.NEG_P, 'binary');
  permaLV.NEG_E = calcLex(PERMA.NEG_E, wordCount, permaInt.NEG_E, 'binary');
  permaLV.NEG_R = calcLex(PERMA.NEG_R, wordCount, permaInt.NEG_R, 'binary');
  permaLV.NEG_M = calcLex(PERMA.NEG_M, wordCount, permaInt.NEG_M, 'binary');
  permaLV.NEG_A = calcLex(PERMA.NEG_A, wordCount, permaInt.NEG_A, 'binary');

  // create printable array of words/tokens
  var permaPrint = handleDuplicates(PERMA);

  // make charts
  var ctx1 = document.getElementById('permaPie').getContext('2d');
  var ctx2 = document.getElementById('permaRad').getContext('2d');
  var piedata = {
    labels: [
      'Positive',
      'Negative',
    ],
    datasets: [
      {
        data: [PERMA.counts.POS_T, PERMA.counts.NEG_T],
        backgroundColor: [
          '#77dd77',
          '#FF6384',
        ],
        hoverBackgroundColor: [
          '#77dd77',
          '#FF6384',
        ],
      }],
  };
  var radardata = {
    labels: [
      'Emotion',
      'Engagement',
      'Relationships',
      'Meaning',
      'Accomplishment',
    ],
    datasets: [
      {
        label: 'Positive',
        backgroundColor: 'rgba(119, 221, 119,0.2)',
        borderColor: '#77dd77',
        pointBackgroundColor: 'rgba(179,181,198,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#77dd77',
        data: [
          permaLV.POS_P,
          permaLV.POS_E,
          permaLV.POS_R,
          permaLV.POS_M,
          permaLV.POS_A,
        ],
      },
      {
        label: 'Negative',
        backgroundColor: 'rgba(255,99,132,0.2)',
        borderColor: 'rgba(255,99,132,1)',
        pointBackgroundColor: 'rgba(255,99,132,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(255,99,132,1)',
        data: [
          permaLV.NEG_P,
          permaLV.NEG_E,
          permaLV.NEG_R,
          permaLV.NEG_M,
          permaLV.NEG_A,
        ],
      },
      {
        label: 'Zero',
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderColor: '#000',
        pointBackgroundColor: 'rgba(0,0,0,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#000',
        data: [0, 0, 0, 0, 0],
      },
    ],
  };
  pieChart = new Chart(ctx1, {
    type: 'pie',
    data: piedata,
  });
  radarChart = new Chart(ctx2, {
    type: 'radar',
    data: radardata,
  });

  // do the same for prospection
  if (prospectCheck.checked) {
    var PROSP = sortMatches(tokens, prospLex);
    PROSP.counts.TOTAL = getWords(PROSP, '').length;
    var prospLV = {
      PAST: calcLex(PROSP.PAST, wordCount, (-0.649406376419), 'binary'),
      PRESENT: calcLex(PROSP.PRESENT, wordCount, 0.236749577324, 'binary'),
      FUTURE: calcLex(PROSP.FUTURE, wordCount, (-0.570547567181), 'binary'),
    };
    var prospPrint = handleDuplicates(PROSP);
  }

  // do the same for affect
  if (affectCheck.checked) {
    var AFF = sortMatches(tokens, affLex);
    var affLV = {
      AFFECT: calcLex(AFF.AFFECT, wordCount, 5.037104721, 'binary'),
      INTENSITY: calcLex(AFF.INTENSITY, wordCount, 2.399762631, 'binary'),
    };
    var affPrint = handleDuplicates(AFF);

    /* if (affLV.AFFECT > 9) affLV.AFFECT = 9.000;
    if (affLV.INTENSITY > 9) affLV.INTENSITY = 9.000;
    if (affLV.AFFECT < 1) affLV.AFFECT = 1.000;
    if (affLV.INTENSITY < 1) affLV.INTENSITY = 1.000; */

    var bubData = {
      datasets: [
        {
          label: 'Affect / Intensity',
          data: [
            {
              x: affLV.AFFECT,
              y: affLV.INTENSITY,
              r: 5,
            },
          ],
          backgroundColor: '#FF6384',
          hoverBackgroundColor: '#FF6384',
        }],
    };

    var options = {
      scales: {
        yAxes: [{
          ticks: {
            max: 9,
            min: 1,
            stepSize: 1,
          },
          scaleLabel: {
            display: true,
            labelString: 'Intensity',
          },
        }],
        xAxes: [{
          ticks: {
            max: 9,
            min: 1,
            stepSize: 1,
          },
          scaleLabel: {
            display: true,
            labelString: 'Affect',
          },
        }],
      },
    };

    var ctx4 = document.getElementById('affBubble').getContext('2d');
    affChart = new Chart(ctx4, {
      type: 'bubble',
      data: bubData,
      options: options,
    });
  }

  // do the same for optimism
  if (optimismCheck.checked) {
    var future = getWords(PROSP, 'FUTURE');
    var OPT = sortMatches(future, affLex);
    var optLV = calcLex(OPT.AFFECT, wordCount, 5.037104721, 'binary');
    var optPrint = handleDuplicates(OPT);
  }

  // do the same for big five
  if (bigFiveCheck.checked) {
    var FIVE = sortMatches(tokens, big5Lex);
    FIVE.counts.TOTAL = getWords(FIVE, '').length;
    var fiveLV = {};
    fiveLV.O = calcLex(FIVE.O, wordCount, 0, 'binary');
    fiveLV.C = calcLex(FIVE.C, wordCount, 0, 'binary');
    fiveLV.E = calcLex(FIVE.E, wordCount, 0, 'binary');
    fiveLV.A = calcLex(FIVE.A, wordCount, 0, 'binary');
    fiveLV.N = calcLex(FIVE.N, wordCount, 0, 'binary');
    var fivePrint = handleDuplicates(FIVE);

    var fiveData = {
      labels: [
        'Openness',
        'Conscientiousness',
        'Extraversion',
        'Agreeableness',
        'Neuroticism',
      ],
      datasets: [
        {
          label: 'Big Five Personality Traits',
          backgroundColor: 'rgba(119, 221, 119,0.2)',
          borderColor: '#77dd77',
          pointBackgroundColor: 'rgba(179,181,198,1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#77dd77',
          data: [
            fiveLV.O,
            fiveLV.C,
            fiveLV.E,
            fiveLV.A,
            fiveLV.N,
          ],
        },
        {
          label: 'Zero',
          backgroundColor: 'rgba(0, 0, 0, 0)',
          borderColor: '#000',
          pointBackgroundColor: 'rgba(0,0,0,1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#000',
          data: [0, 0, 0, 0, 0],
        },
      ],
    };

    var ctx3 = document.getElementById('fiveRadar').getContext('2d');
    fiveChart = new Chart(ctx3, {
      type: 'radar',
      data: fiveData,
    });
  }

  // do the same for dark triad
  if (darkTriadCheck.checked) {
    var DARK = sortMatches(tokens, darkLex);
    DARK.counts.TOTAL = getWords(DARK, '').length;
    var darkLV = {
      darktriad: calcLex(DARK.darktriad, wordCount, 0.632024388686, 'binary'),
      machiavellianism: calcLex(DARK.machiavellianism, wordCount, 0.596743883684, 'binary'),
      narcissism: calcLex(DARK.narcissism, wordCount, 0.714881303759, 'binary'),
      psychopathy: calcLex(DARK.psychopathy, wordCount, 0.48892463341, 'binary'),
    };
    var darkPrint = handleDuplicates(DARK);
  }

  // do the same for age & gender
  if (ageCheck.checked) {
    var AGE = sortMatches(tokens, ageLex);
    var ageLV = calcLex(AGE.AGE, wordCount, 23.2188604687, 'freq').toFixed(2);
    var GENDER = sortMatches(tokens, genderLex);
    var genderLV = calcLex(GENDER.GENDER, wordCount, (-0.06724152), 'freq');
  }

  // calculate PERMA percentages
  var neutralWords = (wordCount - PERMA.counts.TOTAL);
  var matchCent = ((PERMA.counts.TOTAL / wordCount) * 100).toFixed(2);
  var neutralCent = ((neutralWords / wordCount) * 100).toFixed(2);

  // calculate PERMA ratio
  var PERMARatioStatement;
  if (PERMA.counts.POS_T === 0 || PERMA.counts.NEG_T === 0) {
    if (PERMA.counts.POS_T < PERMA.counts.NEG_T) {
      PERMARatioStatement = 'Of the matches, 100% were negative PERMA matches.';
    } else if (PERMA.counts.POS_T > PERMA.counts.NEG_T) {
      PERMARatioStatement = 'Of the matches, 100% were positive PERMA matches.';
    } else if (PERMA.counts.POS_T === PERMA.counts.NEG_T) {
      PERMARatioStatement = 'There were no PERMA matches in the input.';
    }
  } else if (PERMA.counts.POS_T < PERMA.counts.NEG_T) {
    PERMARatioStatement = 'For every positive PERMA match there are ' +
      ((PERMA.counts.NEG_T / PERMA.counts.POS_T).toFixed(3)) +
      ' times as many negative PERMA matches.';
  } else if (PERMA.counts.POS_T > PERMA.counts.NEG_T) {
    PERMARatioStatement = 'For every negative PERMA match there are ' +
      ((PERMA.counts.POS_T / PERMA.counts.NEG_T).toFixed(3)) +
      ' times as many positive PERMA matches.';
  } else if (PERMA.counts.POS_T === PERMA.counts.NEG_T) {
    PERMARatioStatement = 'There are an equal number of + and - PERMA matches.';
  }

  // display results
  // @todo: this is ugly, is there a better way to do this?
  document.getElementById('wordcount').textContent = wordCount;
  document.getElementById('truecount').textContent = trueCount;
  document.getElementById('matches').textContent = PERMA.counts.TOTAL + ' (' + matchCent + '%)';
  document.getElementById('pmatches').textContent = PERMA.counts.POS_T;
  document.getElementById('nmatches').textContent = PERMA.counts.NEG_T;
  document.getElementById('umatches').textContent = neutralWords + ' (' + neutralCent + '%)';
  document.getElementById('ratio').textContent = PERMARatioStatement;
  if (s === '1' || s === '4') {
    document.getElementById('lex').classList.remove('hidden');
    document.getElementById('ppl').textContent = permaLV.POS_P;
    document.getElementById('pel').textContent = permaLV.POS_E;
    document.getElementById('prl').textContent = permaLV.POS_R;
    document.getElementById('pml').textContent = permaLV.POS_M;
    document.getElementById('pal').textContent = permaLV.POS_A;
    document.getElementById('npl').textContent = permaLV.NEG_P;
    document.getElementById('nel').textContent = permaLV.NEG_E;
    document.getElementById('nrl').textContent = permaLV.NEG_R;
    document.getElementById('nml').textContent = permaLV.NEG_M;
    document.getElementById('nal').textContent = permaLV.NEG_A;
    document.getElementById('permaRadar').classList.remove('hidden');
  } else {
    document.getElementById('lex').classList.add('hidden');
    document.getElementById('permaRadar').classList.add('hidden');
  }
  document.getElementById('posP').textContent = permaPrint.POS_P.join(', ');
  document.getElementById('negP').textContent = permaPrint.NEG_P.join(', ');
  document.getElementById('posE').textContent = permaPrint.POS_E.join(', ');
  document.getElementById('negE').textContent = permaPrint.NEG_E.join(', ');
  document.getElementById('posR').textContent = permaPrint.POS_R.join(', ');
  document.getElementById('negR').textContent = permaPrint.NEG_R.join(', ');
  document.getElementById('posM').textContent = permaPrint.POS_M.join(', ');
  document.getElementById('negM').textContent = permaPrint.NEG_M.join(', ');
  document.getElementById('posA').textContent = permaPrint.POS_A.join(', ');
  document.getElementById('negA').textContent = permaPrint.NEG_A.join(', ');
  if (prospectCheck.checked) {
    document.getElementById('prospectRes').classList.remove('hidden');
    document.getElementById('prospTotal').textContent = PROSP.counts.TOTAL;
    document.getElementById('prospPast').textContent = PROSP.counts.PAST;
    document.getElementById('prospPresent').textContent = PROSP.counts.PRESENT;
    document.getElementById('prospFuture').textContent = PROSP.counts.FUTURE;
    document.getElementById('pastLex').textContent = prospLV.PAST;
    document.getElementById('presLex').textContent = prospLV.PRESENT;
    document.getElementById('futrLex').textContent = prospLV.FUTURE;
    document.getElementById('past').textContent = prospPrint.PAST.join(', ');
    document.getElementById('present').textContent = prospPrint.PRESENT.join(', ');
    document.getElementById('future').textContent = prospPrint.FUTURE.join(', ');
  }
  if (affectCheck.checked) {
    document.getElementById('affectRes').classList.remove('hidden');
    document.getElementById('affTotal').textContent = AFF.counts.AFFECT;
    document.getElementById('affLex').textContent = affLV.AFFECT;
    document.getElementById('intLex').textContent = affLV.INTENSITY;
    document.getElementById('affPrint').textContent = affPrint.AFFECT.join(', ');
  }
  if (optimismCheck.checked) {
    document.getElementById('optimRes').classList.remove('hidden');
    document.getElementById('optTotal').textContent = OPT.counts.AFFECT;
    document.getElementById('optLex').textContent = optLV;
    document.getElementById('optPrint').textContent = optPrint.AFFECT.join(', ');
  }
  if (bigFiveCheck.checked) {
    document.getElementById('fiveRes').classList.remove('hidden');
    document.getElementById('fiveTotal').textContent = FIVE.counts.TOTAL;
    document.getElementById('oLex').textContent = fiveLV.O;
    document.getElementById('cLex').textContent = fiveLV.C;
    document.getElementById('eLex').textContent = fiveLV.E;
    document.getElementById('aLex').textContent = fiveLV.A;
    document.getElementById('nLex').textContent = fiveLV.N;
    document.getElementById('oPrint').textContent = fivePrint.O.join(', ');
    document.getElementById('cPrint').textContent = fivePrint.C.join(', ');
    document.getElementById('ePrint').textContent = fivePrint.E.join(', ');
    document.getElementById('aPrint').textContent = fivePrint.A.join(', ');
    document.getElementById('nPrint').textContent = fivePrint.N.join(', ');
  }
  if (darkTriadCheck.checked) {
    document.getElementById('darkRes').classList.remove('hidden');
    document.getElementById('darkTotal').textContent = DARK.counts.TOTAL;
    document.getElementById('darkTriad').textContent = DARK.counts.darktriad;
    document.getElementById('darkMach').textContent = DARK.counts.machiavellianism;
    document.getElementById('darkNarc').textContent = DARK.counts.narcissism;
    document.getElementById('darkPsych').textContent = DARK.counts.psychopathy;
    document.getElementById('triLex').textContent = darkLV.darktriad;
    document.getElementById('machLex').textContent = darkLV.machiavellianism;
    document.getElementById('narcLex').textContent = darkLV.narcissism;
    document.getElementById('psychLex').textContent = darkLV.psychopathy;
    document.getElementById('triad').textContent = darkPrint.darktriad.join(', ');
    document.getElementById('machi').textContent = darkPrint.machiavellianism.join(', ');
    document.getElementById('narci').textContent = darkPrint.narcissism.join(', ');
    document.getElementById('psycho').textContent = darkPrint.psychopathy.join(', ');
  }
  if (ageCheck.checked) {
    document.getElementById('ageRes').classList.remove('hidden');
    document.getElementById('predAge').textContent = ageLV;
    document.getElementById('genRes').classList.remove('hidden');
    var g = 'Unknown';
    if (genderLV < 0) {
      g = 'Male';
    } else if (genderLV > 0) {
      g = 'Female';
    }
    document.getElementById('predGen').textContent = g;
    document.getElementById('genLex').textContent = genderLV;
  }

  // remove loading screen
  document.getElementById('noContent').classList.add('hidden');
  document.getElementById('outputSection').classList.remove('hidden');
  document.getElementById('inputSection').classList.remove('active');
  document.getElementById('results').classList.add('active');
  document.getElementById('iTab').classList.remove('active');
  document.getElementById('rTab').classList.add('active');
  body.classList.remove('loading');
  window.scrollTo(0, 0);
}

document.addEventListener('DOMContentLoaded', function loaded() {
  // load initial lexicon
  loadLexicon('json/perma/permaV3_dd.json', permaDLex, 'dLoaded');

  // event listeners
  document.getElementById('startButton').addEventListener('click', main, false);

  permaSelect.addEventListener('change', function() {
    var i = permaSelect.value;
    if (i === '1') {
      if (lexStatus['dLoaded'] === false) {
        loadLexicon('json/perma/permaV3_dd.json', permaDLex, 'dLoaded');
      }
      enableWeights(-0.38, 0.86);
      enableExtras();
    } else if (i === '2') {
      if (lexStatus['mLoaded'] === false) {
        loadLexicon('json/perma/permaV3_manual.json', permaMLex, 'mLoaded');
      }
      disableWeights();
      enableExtras();
    } else if (i === '3') {
      if (lexStatus['tLoaded'] === false) {
        loadLexicon('json/perma/permaV3_manual_tsp75.json', permaTLex, 'tLoaded');
      }
      disableWeights();
      enableExtras();
    } else if (i === '4') {
      if (lexStatus['sLoaded'] === false) {
        loadLexicon('json/perma/dd_spermaV3.json', permaSLex, 'sLoaded');
      }
      enableWeights(-0.86, 3.35);
      disableExtras();
    } else {
      console.error('#permaSelect: invalid selection. Defaulting to 1.');
      permaSelect.value = '1';
    }
  }, {passive: true});

  prospectCheck.addEventListener('click', function() {
    if (prospectCheck.checked && lexStatus['pLoaded'] === false) {
      loadLexicon('json/prospection/prospection.json', prospLex, 'pLoaded');
    }
    optToggle();
  }, {passive: true});

  affectCheck.addEventListener('click', function() {
    if (affectCheck.checked && lexStatus['aLoaded'] === false) {
      loadLexicon('json/affect/affect.json', affLex, 'aLoaded');
    }
    optToggle();
  }, {passive: true});

  ageCheck.addEventListener('click', function() {
    if (ageCheck.checked && lexStatus['eLoaded'] === false && 
        lexStatus['gLoaded'] === false) {
      loadLexicon('json/age/age.json', ageLex, 'eLoaded');
      loadLexicon('json/gender/gender.json', genderLex, 'gLoaded');
    }
  }, {passive: true, once: true});

  bigFiveCheck.addEventListener('click', function() {
    if (bigFiveCheck.checked && lexStatus['5Loaded'] === false) {
      loadLexicon('json/bigfive/bigfive.json', big5Lex, '5Loaded');
    }
  }, {passive: true, once: true});

  darkTriadCheck.addEventListener('click', function() {
    if (darkTriadCheck.checked && lexStatus['zLoaded'] === false) {
      loadLexicon('json/dark/darktriad.json', darkLex, 'zLoaded');
    }
  }, {passive: true, once: true});

  document.getElementById('CSVCheck').addEventListener('click', function() {
    var alphaCSV = document.getElementById('alphaCSV');
    var alphaCSVCheck = document.getElementById('alphaCheck');
    if (alphaCSV.classList.contains('disabled')) {
      alphaCSV.classList.remove('disabled');
      alphaCSVCheck.disabled = false;
    } else {
      alphaCSV.classList.add('disabled');
      alphaCSVCheck.disabled = true;
    }
  }, {passive: true});

  // activate material elements
  setTimeout(function() {
    $('[data-toggle="popover"]').popover();
    $('.collapse').collapse();
    $('.alert').alert();
  }, 100);

  /*
  * IE10 viewport hack for Surface/desktop Windows 8 bug
  * Copyright 2014-2015 Twitter, Inc.
  * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
  */
  if (navigator.userAgent.match(/IEMobile\/10\.0/)) {
    var msViewportStyle = document.createElement('style');
    msViewportStyle.appendChild(
      document.createTextNode(
        '@-ms-viewport{width:auto!important}'
      )
    );
    document.querySelector('head').appendChild(msViewportStyle);
  }
}, {passive: true, once: true});
