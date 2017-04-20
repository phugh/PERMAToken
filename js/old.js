/* jshint globalstrict: true, browser: true, devel: true, sub: true, esversion: 5, asi: true, -W041 */ /* global $, alert, Chart */
'use strict'; // eslint-disable-line

// Options
var debug = false

// PERMA DD lexicon
var PERMA_POS_P = {}
var PERMA_POS_E = {}
var PERMA_POS_R = {}
var PERMA_POS_M = {}
var PERMA_POS_A = {}
var PERMA_NEG_P = {}
var PERMA_NEG_E = {}
var PERMA_NEG_R = {}
var PERMA_NEG_M = {}
var PERMA_NEG_A = {}

// Spanish PERMA Lexicon
var S_LOADED = false
var S_PERMA_POS_P = {}
var S_PERMA_POS_E = {}
var S_PERMA_POS_R = {}
var S_PERMA_POS_M = {}
var S_PERMA_POS_A = {}
var S_PERMA_NEG_P = {}
var S_PERMA_NEG_E = {}
var S_PERMA_NEG_R = {}
var S_PERMA_NEG_M = {}
var S_PERMA_NEG_A = {}

// tsp75 PERMA Lexicons
var T_LOADED = false
var T_PERMA_POS_P = {}
var T_PERMA_POS_E = {}
var T_PERMA_POS_R = {}
var T_PERMA_POS_M = {}
var T_PERMA_POS_A = {}
var T_PERMA_NEG_P = {}
var T_PERMA_NEG_E = {}
var T_PERMA_NEG_R = {}
var T_PERMA_NEG_M = {}
var T_PERMA_NEG_A = {}

// Manual Lexicon
var M_LOADED = false
var M_PERMA_POS_P = {}
var M_PERMA_POS_E = {}
var M_PERMA_POS_R = {}
var M_PERMA_POS_M = {}
var M_PERMA_POS_A = {}
var M_PERMA_NEG_P = {}
var M_PERMA_NEG_E = {}
var M_PERMA_NEG_R = {}
var M_PERMA_NEG_M = {}
var M_PERMA_NEG_A = {}

// Prospection lexicon and intercepts
var PROSP_FUTR = {}
var PROSP_PAST = {}
var PROSP_PRES = {}

// Affect Lexicon
var A_LOADED = false
var AFFECT = {}
var INTENSE = {}

var finalPERMAArray = {
  posP: [],
  negP: [],
  posE: [],
  negE: [],
  posR: [],
  negR: [],
  posM: [],
  negM: [],
  posA: [],
  negA: []
}
var finalPROSPArray = {
  past: [],
  pres: [],
  futr: []
}
var finalAFFArray = {
  a: [],
  i: []
}

var permaNM = []
var prospNM = []
var affNM = []

var PERMAMatchCount = {
  positive: 0,
  negative: 0,
  nm: 0
}
var PROSPMatchCount = {
  past: 0,
  present: 0,
  future: 0,
  nm: 0
}
var AFFMatchCount = {
  a: 0,
  i: 0,
  nm: 0
}

// cache elements
var spanishCheck = document.getElementById('spanishCheck')
var originalCheck = null
var manualCheck = null
var tsp75Check = null
var prospectCheck = document.getElementById('prospectCheck')
var affectCheck = document.getElementById('affectCheck')
var optimismCheck = document.getElementById('optimismCheck')

// 'endsWith' fallback
if (typeof String.prototype.endsWith !== 'function') {
  String.prototype.endsWith = function (str) { // eslint-disable-line
    return this.slice(-str.length) === str
  }
}

function emptyArrays () {
  var key = null
  for (key in finalPERMAArray) {
    if (finalPERMAArray.hasOwnProperty(key)) {
      finalPERMAArray[key].length = 0
    }
  }
  for (key in finalPROSPArray) {
    if (finalPROSPArray.hasOwnProperty(key)) {
      finalPROSPArray[key].length = 0
    }
  }
  for (key in finalAFFArray) {
    if (finalAFFArray.hasOwnProperty(key)) {
      finalAFFArray[key].length = 0
    }
  }
  for (key in PERMAMatchCount) {
    if (PERMAMatchCount.hasOwnProperty(key)) {
      PERMAMatchCount[key] = 0
    }
  }
  for (key in PROSPMatchCount) {
    if (PROSPMatchCount.hasOwnProperty(key)) {
      PROSPMatchCount[key] = 0
    }
  }
  for (key in AFFMatchCount) {
    if (AFFMatchCount.hasOwnProperty(key)) {
      AFFMatchCount[key] = 0
    }
  }
}

/**
* Escape special charaters for RegExps
* @function escapeRegExp
* @param  {string} str {input string}
* @return {string} {escaped string}
*/
function escapeRegExp (str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&') // eslint-disable-line
}

/**
* Make sensible regular expressions
* @function fixRegExp
* @param  {string} str {a string to affeix regexps to}
* @param  {string} opts {the regex options, e.g. /g}
* @return {RegExp} {returns a new regular expression}
*/
function fixRegExp (str, opts) {
  opts = opts || 'gi'
  var letterStart = /^[a-zA-Z]/gi
  var letterEnd = /[a-zA-Z](?=\s|$)/gi

  // escape special characters first
  str = str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&') // eslint-disable-line

  // if the string starts with a letter ...
  if (str.match(letterStart)) {
    // ... and ends with a letter ...
    if (str.match(letterEnd)) {
      // ... affix boundary modifiers to the start and end
      str = '\\b' + str + '\\b'
    } else {
      // ... or just the start
      str = '\\b' + str
    }
  }

  /* this is because a lot of the lexicon starts or ends with
  ** punctuation or is just a single letter, e.g. 'o' -
  ** we don't want to match every instance of 'o' just 'o' on its own
  ** i.e. /\bo\b/g */

  return new RegExp(str, opts)
}

/**
* @function makeCSV
* @param  {array} arr  {array}
* @param  {string} opts options
* @return {URI} {CSV encoded URI}
*/
function makeCSV (arr, opts) {
  opts = opts || null

  if (opts === 'alpha') {
    arr.sort()
  }

  var lineArray = []
  arr.forEach(function (word, index) {
    word = word.replace(/'/g, '^')
    lineArray.push(word)
  })
  var csvContent = lineArray.join('\n')
  var encodedUri = encodeURI('data:text/csv;charset=UTF-16LE,' + csvContent)

  return encodedUri
}

/**
* @function sortMatches
* @param  {object} obj {description}
* @param  {string} str {description}
* @return {array} {description}
*/
function sortMatches (obj, str) {
  var matches = []
  $.each(obj, function (a, b) {
    var orig = b.term.toString()
    var word = fixRegExp(b.term.toString(), 'gi')
    var words = str.match(word)
    if (words != null) {
      matches.push(words)
      if (b.category.startsWith('POS')) {
        PERMAMatchCount['positive'] += 1
      } else if (b.category.startsWith('NEG')) {
        PERMAMatchCount['negative'] += 1
      } else if (b.category.startsWith('PRESENT')) {
        PROSPMatchCount['present'] += 1
      } else if (b.category.startsWith('PAST')) {
        PROSPMatchCount['past'] += 1
      } else if (b.category.startsWith('FUTURE')) {
        PROSPMatchCount['future'] += 1
      } else if (b.category.startsWith('AFFECT')) {
        AFFMatchCount['a'] += 1
      } else if (b.category.startsWith('INTENSITY')) {
        AFFMatchCount['i'] += 1
      }
    } else {
      if (b.category.startsWith('POS')) {
        permaNM.push(orig)
      } else if (b.category.startsWith('NEG')) {
        permaNM.push(orig)
      } else if (b.category.startsWith('PRESENT')) {
        prospNM.push(orig)
      } else if (b.category.startsWith('PAST')) {
        prospNM.push(orig)
      } else if (b.category.startsWith('FUTURE')) {
        prospNM.push(orig)
      } else if (b.category.startsWith('AFFECT')) {
        affNM.push(orig)
      } else if (b.category.startsWith('INTENSITY')) {
        affNM.push(orig)
      }
    }
  })
  return matches
}

/**
* Calculate an arrays lexical value
* @function calcLex
* @param  {array} arr {array of matches}
* @param  {object} obj {original lexicon object}
* @param  {number} intercept {intercept value}
* @return {number} {the lexical value}
*/
function calcLex (arr, obj, intercept) {
  intercept = intercept || 0
  var total = arr.length
  var lexN = []
  $.each(arr, function (a, b) {
    var word = b[0]
    var repeats = b.length
    var value = null
    var count = repeats / total
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (word === obj[key].term) {
          value = count * (obj[key].weight)
          lexN.push(value)
          if (debug) console.log(word + ' appears ' + repeats + ' times. Divided by ' + total + ' = ' + count + '. Times by ' + obj[key].weight + ' = ' + value + '.')
        }
      }
    }
  })
  var lex = lexN.reduce(function (a, b) { return a + b }, 0)
  lex = (lex + intercept).toFixed(3)
  return Number(lex)
}

/**
*  Load and sort Affect Intensity Lexicon
* @function loadMan
*/
function loadAffect () {
  var ESP = {}
  $('body').addClass('loading')
  $.getJSON('/../json/affect/affect.json', function (data) {
    ESP = data
  }).then(function () {
    var i = 0
    for (var key in ESP) {
      if (ESP.hasOwnProperty(key)) {
        if (ESP[key]['category'] === 'INTENSITY_AVG') {
          i = Object.keys(INTENSE).length
          INTENSE[i] = ESP[key]
        } else if (ESP[key]['category'] === 'AFFECT_AVG') {
          i = Object.keys(AFFECT).length
          AFFECT[i] = ESP[key]
        } else console.error('Error sorting Affect Lexicon')
      }
    }
    A_LOADED = true
    $('body').removeClass('loading')
  })
}

/**
*  Load and sort Manual PERMA Lexicon
* @function loadMan
*/
function loadMan () {
  var ESP = {}
  $('body').addClass('loading')
  $.getJSON('/../json/perma/permaV3_manual.json', function (data) {
    ESP = data
  }).then(function () {
    var i = 0
    for (var key in ESP) {
      if (ESP.hasOwnProperty(key)) {
        if (ESP[key]['category'] === 'POS_P') {
          i = Object.keys(M_PERMA_POS_P).length
          M_PERMA_POS_P[i] = ESP[key]
        } else if (ESP[key]['category'] === 'POS_E') {
          i = Object.keys(M_PERMA_POS_E).length
          M_PERMA_POS_E[i] = ESP[key]
        } else if (ESP[key]['category'] === 'POS_R') {
          i = Object.keys(M_PERMA_POS_R).length
          M_PERMA_POS_R[i] = ESP[key]
        } else if (ESP[key]['category'] === 'POS_M') {
          i = Object.keys(M_PERMA_POS_M).length
          M_PERMA_POS_M[i] = ESP[key]
        } else if (ESP[key]['category'] === 'POS_A') {
          i = Object.keys(M_PERMA_POS_A).length
          M_PERMA_POS_A[i] = ESP[key]
        } else if (ESP[key]['category'] === 'NEG_P') {
          i = Object.keys(M_PERMA_NEG_P).length
          M_PERMA_NEG_P[i] = ESP[key]
        } else if (ESP[key]['category'] === 'NEG_E') {
          i = Object.keys(M_PERMA_NEG_E).length
          M_PERMA_NEG_E[i] = ESP[key]
        } else if (ESP[key]['category'] === 'NEG_R') {
          i = Object.keys(M_PERMA_NEG_R).length
          M_PERMA_NEG_R[i] = ESP[key]
        } else if (ESP[key]['category'] === 'NEG_M') {
          i = Object.keys(M_PERMA_NEG_M).length
          M_PERMA_NEG_M[i] = ESP[key]
        } else if (ESP[key]['category'] === 'NEG_A') {
          i = Object.keys(M_PERMA_NEG_A).length
          M_PERMA_NEG_A[i] = ESP[key]
        } else console.error('Error sorting M_PERMA Lexicon')
      }
    }
    M_LOADED = true
    $('body').removeClass('loading')
  })
}

/**
*  Load and sort tsp75 PERMA Lexicon
* @function loadTSP
*/
function loadTSP () {
  var ESP = {}
  $('body').addClass('loading')
  $.getJSON('/../json/perma/permaV3_manual_tsp75.json', function (data) {
    ESP = data
  }).then(function () {
    var i = 0
    for (var key in ESP) {
      if (ESP.hasOwnProperty(key)) {
        if (ESP[key]['category'] === 'POS_P') {
          i = Object.keys(T_PERMA_POS_P).length
          T_PERMA_POS_P[i] = ESP[key]
        } else if (ESP[key]['category'] === 'POS_E') {
          i = Object.keys(T_PERMA_POS_E).length
          T_PERMA_POS_E[i] = ESP[key]
        } else if (ESP[key]['category'] === 'POS_R') {
          i = Object.keys(T_PERMA_POS_R).length
          T_PERMA_POS_R[i] = ESP[key]
        } else if (ESP[key]['category'] === 'POS_M') {
          i = Object.keys(T_PERMA_POS_M).length
          T_PERMA_POS_M[i] = ESP[key]
        } else if (ESP[key]['category'] === 'POS_A') {
          i = Object.keys(T_PERMA_POS_A).length
          T_PERMA_POS_A[i] = ESP[key]
        } else if (ESP[key]['category'] === 'NEG_P') {
          i = Object.keys(T_PERMA_NEG_P).length
          T_PERMA_NEG_P[i] = ESP[key]
        } else if (ESP[key]['category'] === 'NEG_E') {
          i = Object.keys(T_PERMA_NEG_E).length
          T_PERMA_NEG_E[i] = ESP[key]
        } else if (ESP[key]['category'] === 'NEG_R') {
          i = Object.keys(T_PERMA_NEG_R).length
          T_PERMA_NEG_R[i] = ESP[key]
        } else if (ESP[key]['category'] === 'NEG_M') {
          i = Object.keys(T_PERMA_NEG_M).length
          T_PERMA_NEG_M[i] = ESP[key]
        } else if (ESP[key]['category'] === 'NEG_A') {
          i = Object.keys(T_PERMA_NEG_A).length
          T_PERMA_NEG_A[i] = ESP[key]
        } else console.error('Error sorting T_PERMA Lexicon')
      }
    }
    T_LOADED = true
    $('body').removeClass('loading')
  })
}

/**
*  Load and sort Spanish PERMA Lexicon
* @function loadSpanish
*/
function loadSpanish () {
  // Spanish
  var ESP = {}
  $('body').addClass('loading')
  $.getJSON('/../json/perma/dd_spermaV3.json', function (data) {
    ESP = data
  }).then(function () {
    var i = 0
    for (var key in ESP) {
      if (ESP.hasOwnProperty(key)) {
        if (ESP[key]['category'] === 'POS_P') {
          i = Object.keys(S_PERMA_POS_P).length
          S_PERMA_POS_P[i] = ESP[key]
        } else if (ESP[key]['category'] === 'POS_E') {
          i = Object.keys(S_PERMA_POS_E).length
          S_PERMA_POS_E[i] = ESP[key]
        } else if (ESP[key]['category'] === 'POS_R') {
          i = Object.keys(S_PERMA_POS_R).length
          S_PERMA_POS_R[i] = ESP[key]
        } else if (ESP[key]['category'] === 'POS_M') {
          i = Object.keys(S_PERMA_POS_M).length
          S_PERMA_POS_M[i] = ESP[key]
        } else if (ESP[key]['category'] === 'POS_A') {
          i = Object.keys(S_PERMA_POS_A).length
          S_PERMA_POS_A[i] = ESP[key]
        } else if (ESP[key]['category'] === 'NEG_P') {
          i = Object.keys(S_PERMA_NEG_P).length
          S_PERMA_NEG_P[i] = ESP[key]
        } else if (ESP[key]['category'] === 'NEG_E') {
          i = Object.keys(S_PERMA_NEG_E).length
          S_PERMA_NEG_E[i] = ESP[key]
        } else if (ESP[key]['category'] === 'NEG_R') {
          i = Object.keys(S_PERMA_NEG_R).length
          S_PERMA_NEG_R[i] = ESP[key]
        } else if (ESP[key]['category'] === 'NEG_M') {
          i = Object.keys(S_PERMA_NEG_M).length
          S_PERMA_NEG_M[i] = ESP[key]
        } else if (ESP[key]['category'] === 'NEG_A') {
          i = Object.keys(S_PERMA_NEG_A).length
          S_PERMA_NEG_A[i] = ESP[key]
        } else console.error('Error sorting S_PERMA Lexicon')
      }
    }
    S_LOADED = true
    $('body').removeClass('loading')
  })
}

/**
* Load and sort JSON files into objects
* @function loader
*/
function loader () {
  var PERMA_DD = {}
  var PROSP = {}

  $.getJSON('/../json/perma/permaV3_dd.json', function (data) {
    PERMA_DD = data
  }).then(function () {
    if (debug) console.log('PERMA lexicon file loaded!')
    $.getJSON('/../json/prospection/prospection.json', function (data) {
      PROSP = data
    }).then(function () {
      if (debug) console.log('Prospection lexicon file loaded!')

      var key = null
      var i = 0
      // sort perma
      for (key in PERMA_DD) {
        if (PERMA_DD.hasOwnProperty(key)) {
          if (PERMA_DD[key]['category'] === 'POS_P') {
            i = Object.keys(PERMA_POS_P).length
            PERMA_POS_P[i] = PERMA_DD[key]
          } else if (PERMA_DD[key]['category'] === 'POS_E') {
            i = Object.keys(PERMA_POS_E).length
            PERMA_POS_E[i] = PERMA_DD[key]
          } else if (PERMA_DD[key]['category'] === 'POS_R') {
            i = Object.keys(PERMA_POS_R).length
            PERMA_POS_R[i] = PERMA_DD[key]
          } else if (PERMA_DD[key]['category'] === 'POS_M') {
            i = Object.keys(PERMA_POS_M).length
            PERMA_POS_M[i] = PERMA_DD[key]
          } else if (PERMA_DD[key]['category'] === 'POS_A') {
            i = Object.keys(PERMA_POS_A).length
            PERMA_POS_A[i] = PERMA_DD[key]
          } else if (PERMA_DD[key]['category'] === 'NEG_P') {
            i = Object.keys(PERMA_NEG_P).length
            PERMA_NEG_P[i] = PERMA_DD[key]
          } else if (PERMA_DD[key]['category'] === 'NEG_E') {
            i = Object.keys(PERMA_NEG_E).length
            PERMA_NEG_E[i] = PERMA_DD[key]
          } else if (PERMA_DD[key]['category'] === 'NEG_R') {
            i = Object.keys(PERMA_NEG_R).length
            PERMA_NEG_R[i] = PERMA_DD[key]
          } else if (PERMA_DD[key]['category'] === 'NEG_M') {
            i = Object.keys(PERMA_NEG_M).length
            PERMA_NEG_M[i] = PERMA_DD[key]
          } else if (PERMA_DD[key]['category'] === 'NEG_A') {
            i = Object.keys(PERMA_NEG_A).length
            PERMA_NEG_A[i] = PERMA_DD[key]
          } else console.error('Error sorting PERMA Lexicon')
        }
      }
      PERMA_DD = null
      // sort prosp
      for (key in PROSP) {
        if (PROSP.hasOwnProperty(key)) {
          if (PROSP[key]['category'] === 'PAST_OR_NOT') {
            i = Object.keys(PROSP_PAST).length
            PROSP_PAST[i] = PROSP[key]
          } else if (PROSP[key]['category'] === 'PRESENT_OR_NOT') {
            i = Object.keys(PROSP_PRES).length
            PROSP_PRES[i] = PROSP[key]
          } else if (PROSP[key]['category'] === 'FUTURE_OR_NOT') {
            i = Object.keys(PROSP_FUTR).length
            PROSP_FUTR[i] = PROSP[key]
          } else console.error('Error sorting PROSP Lexicon')
        }
      }
      PROSP = null

      // Probably safe to show the page at this point
      $('body').removeClass('loading')

      $.getJSON('/../json/perma/permaV3_dd.json', function (data) {
        PERMA_DD = data
      })
    })
  })
}

/**
* @function handleDuplicates
* @param  {array} arr   {description}
* @param  {string} block {description}
*/
function handleDuplicates (arr, block, out) {
  var len = arr.length
  for (var i = 0; i < len; i++) {
    var item = arr[i][0]
    var repeats = arr[i].length
    if (repeats === 1) {
      out[block].push(' ' + item)
    } else {
      out[block].push(' ' + item + '[' + repeats + ']')
    }
  }
}

function main () {
  $('body').addClass('loading')

  // clear canvases for redrawing
  var c = document.getElementsByTagName('canvas')
  for (var i = 0; i < c.length; i++) {
    var ctx = c[i].getContext('2d')
    ctx.clearRect(0, 0, c[i].width, c[i].height)
  }

  // Get input
  var textInput = $('#textInput').val().trim().toLowerCase()

  // Check we have input
  if (textInput.length === 0) {
    return alert('Input box is empty!')
  }

  // Create token array
  var reg = new RegExp(/\b\S+\b/g)
  var result = null
  var tokenArray = []
  while ((result = reg.exec(textInput))) {
    tokenArray.push(result[0])
  }

  // Generate CSV of tokens and alphabetise if the user has selected this feature
  if (document.getElementById('generateCSVCheck').checked === true) {
    var uri = null
    if (document.getElementById('alphabetiseCheck').checked === true) {
      uri = makeCSV(tokenArray, 'alpha')
    } else {
      uri = makeCSV(tokenArray)
    }
    $('#buttonRow').append("<a class='btn btn-default' id='csvButton' href='" + uri + "' download='perma_tokens_" + $.now() + ".csv'>Save CSV</a>")
  }

  // ANALYSE TEXT
  var wordCount = tokenArray.length

  var tag = 'words'
  if ($('input[id=originalLex]:checked').length > 0) {
    tag = 'tokens'
  }

  // set variables based on chosen lexicon
  var lexSet = []
  if (spanishCheck.checked) {
    lexSet.push(S_PERMA_POS_P, S_PERMA_POS_E, S_PERMA_POS_R, S_PERMA_POS_M, S_PERMA_POS_A, S_PERMA_NEG_P, S_PERMA_NEG_E, S_PERMA_NEG_R, S_PERMA_NEG_M, S_PERMA_NEG_A)
  } else if (manualCheck.checked) {
    lexSet.push(M_PERMA_POS_P, M_PERMA_POS_E, M_PERMA_POS_R, M_PERMA_POS_M, M_PERMA_POS_A, M_PERMA_NEG_P, M_PERMA_NEG_E, M_PERMA_NEG_R, M_PERMA_NEG_M, M_PERMA_NEG_A)
  } else if (tsp75Check.checked) {
    lexSet.push(T_PERMA_POS_P, T_PERMA_POS_E, T_PERMA_POS_R, T_PERMA_POS_M, T_PERMA_POS_A, T_PERMA_NEG_P, T_PERMA_NEG_E, T_PERMA_NEG_R, T_PERMA_NEG_M, T_PERMA_NEG_A)
  } else {
    lexSet.push(PERMA_POS_P, PERMA_POS_E, PERMA_POS_R, PERMA_POS_M, PERMA_POS_A, PERMA_NEG_P, PERMA_NEG_E, PERMA_NEG_R, PERMA_NEG_M, PERMA_NEG_A)
  }

  // Find PERMA matches
  var PERMAMatches = {}
  PERMAMatches['posP'] = sortMatches(lexSet[0], textInput)
  PERMAMatches['posE'] = sortMatches(lexSet[1], textInput)
  PERMAMatches['posR'] = sortMatches(lexSet[2], textInput)
  PERMAMatches['posM'] = sortMatches(lexSet[3], textInput)
  PERMAMatches['posA'] = sortMatches(lexSet[4], textInput)
  PERMAMatches['negP'] = sortMatches(lexSet[5], textInput)
  PERMAMatches['negE'] = sortMatches(lexSet[6], textInput)
  PERMAMatches['negR'] = sortMatches(lexSet[7], textInput)
  PERMAMatches['negM'] = sortMatches(lexSet[8], textInput)
  PERMAMatches['negA'] = sortMatches(lexSet[9], textInput)

  var PERMAMatchCountPos = PERMAMatchCount['positive']
  var PERMAMatchCountNeg = PERMAMatchCount['negative']
  var PERMAMatchCountTotal = PERMAMatchCountPos + PERMAMatchCountNeg

  var uniquePERMAWords = []
  var abc = []
  $.each(permaNM, function (i, el) {
    if ($.inArray(el, uniquePERMAWords) === -1) {
      uniquePERMAWords.push(el)
    } else {
      abc.push(el)
    }
  })
  $.each(PERMAMatches, function (x, y) {
    console.log(y)
    if ($.inArray(y, abc) === -1) {
      console.log('WOW')
    }
  })

  // Calculate PERMA numbers
  var PERMACent = (((PERMAMatchCountTotal / wordCount) * 100).toFixed(2))
  var posCent = (((PERMAMatchCountPos / wordCount) * 100).toFixed(2))
  var negCent = (((PERMAMatchCountNeg / wordCount) * 100).toFixed(2))
  var pwcX = (wordCount - PERMAMatchCountTotal)

  // Calculate PERMA lexical values
  var PERMALex = {}
  PERMALex['posP'] = calcLex(PERMAMatches['posP'], lexSet[0], null)
  PERMALex['posE'] = calcLex(PERMAMatches['posE'], lexSet[1], null)
  PERMALex['posR'] = calcLex(PERMAMatches['posR'], lexSet[2], null)
  PERMALex['posM'] = calcLex(PERMAMatches['posM'], lexSet[3], null)
  PERMALex['posA'] = calcLex(PERMAMatches['posA'], lexSet[4], null)
  PERMALex['negP'] = calcLex(PERMAMatches['negP'], lexSet[5], null)
  PERMALex['negE'] = calcLex(PERMAMatches['negE'], lexSet[6], null)
  PERMALex['negR'] = calcLex(PERMAMatches['negR'], lexSet[7], null)
  PERMALex['negM'] = calcLex(PERMAMatches['negM'], lexSet[8], null)
  PERMALex['negA'] = calcLex(PERMAMatches['negA'], lexSet[9], null)

  // calculate ratio
  var PERMARatioStatement = ''
  if (PERMAMatchCountPos === 0 || PERMAMatchCountNeg === 0) {
    if (PERMAMatchCountPos < PERMAMatchCountNeg) {
      PERMARatioStatement = 'Of the matches, 100% were negative PERMA ' + tag + '.'
    } else if (PERMAMatchCountPos > PERMAMatchCountNeg) {
      PERMARatioStatement = 'Of the matches, 100% were positive PERMA ' + tag + '.'
    } else if (PERMAMatchCountPos === PERMAMatchCountNeg) {
      PERMARatioStatement = 'There were no PERMA ' + tag + ' in the input.'
    }
  } else if (PERMAMatchCountPos < PERMAMatchCountNeg) {
    PERMARatioStatement = 'For every positive PERMA ' + tag + ' there are ' + ((PERMAMatchCountNeg / PERMAMatchCountPos).toFixed(1)) + ' times as many negative PERMA ' + tag + '.'
  } else if (PERMAMatchCountPos > PERMAMatchCountNeg) {
    PERMARatioStatement = 'For every negative PERMA ' + tag + ' there are ' + ((PERMAMatchCountPos / PERMAMatchCountNeg).toFixed(1)) + ' times as many positive PERMA ' + tag + '.'
  } else if (PERMAMatchCountPos === PERMAMatchCountNeg) {
    PERMARatioStatement = 'There are an equal number of positive and negative PERMA ' + tag + '. 1:1.'
  }

  // remove duplicates from "PERMAMatches" and dump them to "finalPERMAArray" so we can display them neatly
  $.each(PERMAMatches, function (a, b) {
    handleDuplicates(b, a, finalPERMAArray)
  })


  // create charts
  var ctx1 = document.getElementById('donut').getContext('2d')
  var ctx2 = document.getElementById('spider').getContext('2d')
  var piedata = {
    labels: [
      'Positive PERMA Matches',
      'Negative PERMA Matches',
      'Words Not Matched (Neutral)'
    ],
    datasets: [
      {
        data: [PERMAMatchCountPos, PERMAMatchCountNeg, pwcX],
        backgroundColor: [
          '#77dd77',
          '#FF6384',
          '#FFCE56'
        ],
        hoverBackgroundColor: [
          '#77dd77',
          '#FF6384',
          '#FFCE56'
        ]
      }]
  }
  var radardata = {
    labels: [
      'Positive Emotion',
      'Engagement',
      'Relationships',
      'Meaning',
      'Achievement'
    ],
    datasets: [
      {
        label: 'Positive PERMA Tokens',
        backgroundColor: 'rgba(119, 221, 119,0.2)',
        borderColor: '#77dd77',
        pointBackgroundColor: 'rgba(179,181,198,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#77dd77',
        data: [
          JSON.stringify(PERMALex['posP']),
          JSON.stringify(PERMALex['posE']),
          JSON.stringify(PERMALex['posR']),
          JSON.stringify(PERMALex['posM']),
          JSON.stringify(PERMALex['posA'])
        ]
      },
      {
        label: 'Negative PERMA Tokens',
        backgroundColor: 'rgba(255,99,132,0.2)',
        borderColor: 'rgba(255,99,132,1)',
        pointBackgroundColor: 'rgba(255,99,132,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(255,99,132,1)',
        data: [
          JSON.stringify(PERMALex['negP']),
          JSON.stringify(PERMALex['negE']),
          JSON.stringify(PERMALex['negR']),
          JSON.stringify(PERMALex['negM']),
          JSON.stringify(PERMALex['negA'])
        ]
      }
    ]
  }
  var myDoughnutChart = new Chart(ctx1, { // eslint-disable-line
    type: 'pie',
    data: piedata
  })
  var myRadarChart = new Chart(ctx2, { // eslint-disable-line
    type: 'radar',
    data: radardata
  })

  if (prospectCheck.checked === true) {
    // Find prospection matches
    var PROSPMatches = {}
    PROSPMatches['past'] = sortMatches(PROSP_PAST, textInput)
    PROSPMatches['pres'] = sortMatches(PROSP_PRES, textInput)
    PROSPMatches['futr'] = sortMatches(PROSP_FUTR, textInput)

    var PASTMatchCount = PROSPMatchCount['past']
    var PRESMatchCount = PROSPMatchCount['present']
    var FUTRMatchCount = PROSPMatchCount['future']
    var PROSPMatchCount = PASTMatchCount + PRESMatchCount + FUTRMatchCount

    // calculate prospection numbers
    var PROSPCent = (((PROSPMatchCount / wordCount) * 100).toFixed(2))
    var pastCent = (((PASTMatchCount / wordCount) * 100).toFixed(2))
    var presCent = (((PRESMatchCount / wordCount) * 100).toFixed(2))
    var futrCent = (((FUTRMatchCount / wordCount) * 100).toFixed(2))
    var fwcX = (wordCount - PROSPMatchCount)

    // Calculate prospection lexical values
    var PROSP_PAST_INT = (-0.649406376419)
    var PROSP_PRES_INT = 0.236749577324
    var PROSP_FUTR_INT = (-0.570547567181)
    var PROSPLex = {}
    PROSPLex['past'] = calcLex(PROSPMatches['past'], PROSP_PAST, PROSP_PAST_INT)
    PROSPLex['pres'] = calcLex(PROSPMatches['pres'], PROSP_PRES, PROSP_PRES_INT)
    PROSPLex['futr'] = calcLex(PROSPMatches['futr'], PROSP_FUTR, PROSP_FUTR_INT)

    $.each(PROSPMatches, function (a, b) {
      handleDuplicates(b, a, finalPROSPArray)
    })

    // make charts
    var ctx3 = document.getElementById('pdonut').getContext('2d')
    var ctx4 = document.getElementById('pspider').getContext('2d')
    var ppiedata = {
      labels: [
        'Past',
        'Present',
        'Future',
        'Neutral'
      ],
      datasets: [
        {
          data: [PASTMatchCount, PRESMatchCount, FUTRMatchCount, fwcX],
          backgroundColor: [
            '#77dd77',
            '#FF6384',
            '#FFCE56',
            '#E4E4E4'
          ],
          hoverBackgroundColor: [
            '#77dd77',
            '#FF6384',
            '#FFCE56',
            '#E4E4E4'
          ]
        }]
    }
    var pradardata = {
      labels: [
        'Past',
        'Present',
        'Future'
      ],
      datasets: [
        {
          label: 'Temporal Orientation',
          backgroundColor: 'rgba(119, 221, 119,0.2)',
          borderColor: '#77dd77',
          pointBackgroundColor: 'rgba(179,181,198,1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#77dd77',
          data: [
            JSON.stringify(PROSPLex['past']),
            JSON.stringify(PROSPLex['pres']),
            JSON.stringify(PROSPLex['futr'])
          ]
        }
      ]
    }
    var myPDoughnutChart = new Chart(ctx3, { // eslint-disable-line
      type: 'pie',
      data: ppiedata
    })
    var myPRadarChart = new Chart(ctx4, { // eslint-disable-line
      type: 'radar',
      data: pradardata
    })
  }

  if (affectCheck.checked) {
    var AFFMatches = {}
    AFFMatches['a'] = sortMatches(AFFECT, textInput)
    AFFMatches['i'] = sortMatches(INTENSE, textInput)

    var affect_intercept = 5.037104721
    var intensity_intercept = 2.399762631
    var AFFLex = {}
    AFFLex['a'] = calcLex(AFFMatches['a'], AFFECT, affect_intercept)
    AFFLex['i'] = calcLex(AFFMatches['i'], INTENSE, intensity_intercept)

    $.each(AFFMatches, function (a, b) {
      handleDuplicates(b, a, finalAFFArray)
    })
  }


  // display results
  $('.tw').html(tag)
  $('#wordcount').html(wordCount)
  $('#matches').html(PERMAMatchCountTotal)
  $('#pmatches').html(PERMAMatchCountPos)
  $('#nmatches').html(PERMAMatchCountNeg)
  $('#percent').html(PERMACent)
  $('#ppercent').html(posCent)
  $('#npercent').html(negCent)
  $('#ratio').html(PERMARatioStatement)
  if (originalCheck.checked || spanishCheck.checked) {
    $('#lex').removeClass('hidden')
    $('#ppl').html('P: ' + JSON.stringify(PERMALex['posP']))
    $('#pel').html('E: ' + JSON.stringify(PERMALex['posE']))
    $('#prl').html('R: ' + JSON.stringify(PERMALex['posR']))
    $('#pml').html('M: ' + JSON.stringify(PERMALex['posM']))
    $('#pal').html('A: ' + JSON.stringify(PERMALex['posA']))
    $('#npl').html('P: ' + JSON.stringify(PERMALex['negP']))
    $('#nel').html('E: ' + JSON.stringify(PERMALex['negE']))
    $('#nrl').html('R: ' + JSON.stringify(PERMALex['negR']))
    $('#nml').html('M: ' + JSON.stringify(PERMALex['negM']))
    $('#nal').html('A: ' + JSON.stringify(PERMALex['negA']))
    $('#permaRadar').removeClass('hidden')
  } else {
    $('#lex').addClass('hidden')
    $('#permaRadar').addClass('hidden')
  }
  $('#posP').html(finalPERMAArray.posP.toString())
  $('#negP').html(finalPERMAArray.negP.toString())
  $('#posE').html(finalPERMAArray.posE.toString())
  $('#negE').html(finalPERMAArray.negE.toString())
  $('#posR').html(finalPERMAArray.posR.toString())
  $('#negR').html(finalPERMAArray.negR.toString())
  $('#posM').html(finalPERMAArray.posM.toString())
  $('#negM').html(finalPERMAArray.negM.toString())
  $('#posA').html(finalPERMAArray.posA.toString())
  $('#negA').html(finalPERMAArray.negA.toString())
  if (prospectCheck.checked) {
    $('#prospectRes').removeClass('hidden')
    $('#prospTotal').html(PROSPMatchCount)
    $('#prospCent').html(PROSPCent)
    $('#prospPast').html(PASTMatchCount)
    $('#pastCent').html(pastCent)
    $('#prospPresent').html(PRESMatchCount)
    $('#presCent').html(presCent)
    $('#prospFuture').html(FUTRMatchCount)
    $('#futureCent').html(futrCent)
    $('#pastLex').html('Past: ' + JSON.stringify(PROSPLex['past']))
    $('#presLex').html('Present: ' + JSON.stringify(PROSPLex['pres']))
    $('#futrLex').html('Future: ' + JSON.stringify(PROSPLex['futr']))
    $('#past').html(finalPROSPArray.past.toString())
    $('#present').html(finalPROSPArray.pres.toString())
    $('#future').html(finalPROSPArray.futr.toString())
  }
  document.getElementById('outputSection').classList.remove('hidden')
  $('body').removeClass('loading')

  // empty arrays for new batch
  emptyArrays()
}

document.addEventListener('DOMContentLoaded', function loaded () {
  // load the data
  loader()

  /*
  * IE10 viewport hack for Surface/desktop Windows 8 bug
  * Copyright 2014-2015 Twitter, Inc.
  * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
  */
  if (navigator.userAgent.match(/IEMobile\/10\.0/)) {
    var msViewportStyle = document.createElement('style')
    msViewportStyle.appendChild(
      document.createTextNode(
        '@-ms-viewport{width:auto!important}'
      )
    )
    document.querySelector('head').appendChild(msViewportStyle)
  }

  // activate tooltips
  $('[data-toggle="tooltip"]').tooltip()

  // global chart options
  Chart.defaults.global.responsive = false
  Chart.defaults.global.fullWidth = true

  // CSV Alphabetizer button toggler
  document.getElementById('generateCSVCheck').addEventListener('click', function (e) {
    var alphaCSV = document.getElementById('alphaCSV')
    var alphaCSVCheck = document.getElementById('alphabetiseCheck')
    if (alphaCSV.classList.contains('disabled')) {
      alphaCSV.classList.remove('disabled')
      alphaCSVCheck.disabled = false
    } else {
      alphaCSV.classList.add('disabled')
      alphaCSVCheck.disabled = true
    }
  }, false)

  // Radio button handlers
  var radios = document.getElementsByName('permaRadio')
  originalCheck = radios[0]
  manualCheck = radios[1]
  tsp75Check = radios[2]
  spanishCheck.addEventListener('click', function (e) {
    var i = 0
    if (spanishCheck.checked) {
      if (!S_LOADED) loadSpanish()
      for (i = 0; i < radios.length; i++) {
        radios[i].disabled = true
        radios[i].checked = false
      }
    } else {
      for (i = 0; i < radios.length; i++) {
        radios[i].disabled = false
        radios[0].checked = true
      }
    }
  }, false)

  // Optimism Toggler
  var optToggle = function () {
    if (!A_LOADED) loadAffect()
    var optBox = document.getElementById('optBox')
    if (prospectCheck.checked && affectCheck.checked) {
      optimismCheck.disabled = false
      optBox.classList.remove('disabled')
    } else {
      optimismCheck.disabled = true
      optimismCheck.checked = false
      optBox.classList.add('disabled')
    }
  }

  // event listeners
  $('.startButton').on('click', main)
  prospectCheck.addEventListener('click', optToggle, false)
  affectCheck.addEventListener('click', optToggle, false)
  manualCheck.addEventListener('click', function (e) {
    if (!M_LOADED) loadMan()
  }, {once: true})
  tsp75Check.addEventListener('click', function (e) {
    if (!T_LOADED) loadTSP()
  }, {once: true})
}, {once: true}); // eslint-disable-line
