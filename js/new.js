/* global $, alert, Chart */
var debug = true  // debug information toggle

// storage for the loaded PERMA lexicon
var permaLex = {
  POS_P: {},
  POS_E: {},
  POS_R: {},
  POS_M: {},
  POS_A: {},
  NEG_P: {},
  NEG_E: {},
  NEG_R: {},
  NEG_M: {},
  NEG_A: {}
}

// storage for the loaded Prospection lexicon
var prospLex = { PAST: {}, PRESENT: {}, FUTURE: {} }

// storage for the loaded Affect / Intensity lexicon
var affLex = { AFFECT: {}, INTENSITY: {} }

// keep track of which lexica are loaded
var lexStatus = {
  'dLoaded': false, // is the permaV3_dd lexicon loaded?
  'mLoaded': false, // is the permaV3_manual lexicon loaded?
  'tLoaded': false, // is the permaV3_manual_tsp75 lexicon loaded?
  'sLoaded': false, // is the spanish lexicon loaded?
  'pLoaded': false, // is the prospection lexicon loaded?
  'aLoaded': false  // is the affect lexicon loaded?
}

// constant intercept values
var permaInt = {
  POS_P: 2.675173871,
  POS_E: 2.055179283,
  POS_R: 1.977389757,
  POS_M: 1.738298902,
  POS_A: 3.414517804,
  NEG_P: 2.50468297,
  NEG_E: 1.673629622,
  NEG_R: 1.782788984,
  NEG_M: 1.52890284,
  NEG_A: 2.482131179
}
var pastInt = (-0.649406376419)
var presInt = 0.236749577324
var futrInt = (-0.570547567181)
var affInt = 5.037104721
var intInt = 2.399762631

// cache elements
var spanishCheck = document.getElementById('spanishCheck')
var prospectCheck = document.getElementById('prospectCheck')
var affectCheck = document.getElementById('affectCheck')
var optimismCheck = document.getElementById('optimismCheck')
var originalCheck = null
var manualCheck = null
var tsp75Check = null

// is the inputted number even?
function isEven (n) {
  return n % 2 === 0
}

/**
* Load and sort JSON files into the relevant lexicon object
* @function sortLexicon
* @param  {string} file   {JSON file name}
* @param  {string} type   {'perma', 'prospection', or 'affect'}
* @param  {object} obj    {the global lexicon object}
* @param  {string} loader {lexicon 'Loaded' bool. e.g. dLoaded}
*/
function sortLexicon (file, type, obj, loader) {
  var body = document.getElementsByTagName('body')[0]
  // empty array to store loaded lexicon
  var lex = {}
  var lexLength = 0
  var currentItem = 0
  // display the loading screen
  body.classList.add('loading')
  // load JSON and temporarily store it as 'lex'
  var fileName = '/../json/' + type + '/' + file
  $.getJSON(fileName, function (data) {
    lex = data
  }).then(function () {
    lexLength = Object.keys(lex).length
    var i = 0
    for (var key in lex) {
      if (lex.hasOwnProperty(key)) {
        // increment curentItem count
        currentItem++
        // get the lexical category (e.g. "POS_P")
        var cat = lex[key]['category']
        // copy the item to the proper object
        i = Object.keys(obj[cat]).length
        obj[cat][i] = lex[key]
        // if we've reached the end, proceed
        if (currentItem === lexLength) {
          // make it clear the lexica has been loaded
          lexStatus[loader] = true
          // remove the loading screen
          body.classList.remove('loading')
        }
      }
    }
  })
}

/**
* Toggles the 'Analyse Optimism' checkbox
* @function optToggle
*/
function optToggle () {
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

/**
* Clear all the canvas elements for redrawing
* @function clearCanvases
* @return {type} {description}
*/
function clearCanvases () {
  var c = document.getElementsByTagName('canvas')
  for (var i = 0; i < c.length; i++) {
    var ctx = c[i].getContext('2d')
    ctx.clearRect(0, 0, c[i].width, c[i].height)
  }
}

/**
* @function tokenArray
* @param  {string} str {input string}
* @return {array} {an array of tokens}
*/
function tokenArray (str) {
  var reg = new RegExp(/\b\S+\b/g)
  var result = null
  var tokenArray = []
  while ((result = reg.exec(str))) {
    tokenArray.push(result[0])
  }
  return tokenArray
}

/**
* Generate a CSV from array and append download button
* @function makeCSV
* @param  {array} arr {array of tokens}
*/
function makeCSV (arr) {
  if (document.getElementById('alphaCheck').checked === true) {
    arr.sort()
  }
  var lineArray = []
  arr.forEach(function (word, index) {
    word = word.replace(/'/g, '^')
    lineArray.push(word)
  })
  var csvContent = lineArray.join('\n')
  var encodedUri = encodeURI('data:text/csv;charset=UTF-16LE,' + csvContent)
  $('#buttonRow').append("<a class='btn btn-default' id='csvButton' href='" + encodedUri + "' download='perma_tokens_" + $.now() + ".csv'>Save CSV</a>")
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
* Find and sort matched terms against a lexicon
* @function sortMatches
* @param  {string} str {input string}
* @param  {object} obj {lexicon object}
* @return {object} {object of matched terms and weights}
*/
function sortMatches (str, obj) {
  var output = {
    matches: {},
    not: {}
  }
  $.each(obj, function (a, b) {
    var match = []
    var not = []
    $.each(b, function (x, y) {
      var term = y.term.toString()
      var exp = fixRegExp(term, 'gi')
      var matches = str.match(exp)
      if (matches) {
        match.push(matches, y.weight)
      } else {
        not.push(term)
      }
    })
    output.matches[a] = match
    output.not[a] = not
  })
  return output
}

function getWords(obj, str) {
  var store = []
  // find what we're looking for
  $.each(obj.matches, function (a, b) {
    if (a.startsWith(str)) {
      $.each(b, function (x, y) {
        if (isEven(x)) {
          store.push(y)
        }
      })
    }
  })
  return store
}

/**
* Get count of matched items in object
* @function getNumbers
* @param  {object} obj {object to match against}
* @param  {string} str {key to match}
* @return {number} {final count}
*/
function getNumbers (obj, str) {
  var store = getWords(obj, str)
  var num = 0
  $.each(store, function (a, b) {
    num += b.length
  })
  // return the total
  return Number(num)
}

/* function getNM (obj, str) {
  var list = []
  $.each(obj.not, function (a, b) {
    if (a.startsWith(str)) {
      $.each(b, function (i, el) {
        list.push(el)
      })
    }
  })
  var uniqueNames = []
  $.each(list, function (i, el) {
    if ($.inArray(el, uniqueNames) === -1) uniqueNames.push(el)
  })
  var num = list.length - uniqueNames.length
  return Number(num)
} */

/**
* Remove duplicates by appending count to item
* @function handleDuplicates
* @param  {object} obj {input object}
* @return {object} {output object}
*/
function handleDuplicates (obj) {
  var out = {}
  $.each(obj, function (a, b) {
    var list = []
    $.each(b, function (i, el) {
      if (isEven(i)) {
        if (el.length > 1) {
          list.push(el[0] + '[' + el.length + ']')
        } else {
          list.push(el[0])
        }
      }
    })
    out[a] = list
  })
  return out
}

function calcLex (obj, wc, int) {
  int = int || 0
  var num = 0
  var counts = []
  var weights = []
  $.each(obj, function (a, b) {
    if (isEven(a)) {
      counts.push(b.length)
    } else {
      weights.push(b)
    }
  })
  var sums = []
  $.each(counts, function (a, b) {
    var z = (counts[a] / wc) * weights[a]
    sums.push(z)
  })
  num = sums.reduce(function (a, b) { return a + b }, 0)
  num = num + int
  return Number(num)
}

function arrToStr(arr) {
  var str = null
  var words = []
  $.each(arr, function (a, b) {
    $.each(b, function (x, y) {
      words.push(y)
    })
  })
  str = words.join(' ')
  return str
}

function main () {
  // display loading screen
  var body = document.getElementsByTagName('body')[0]
  body.classList.add('loading')

  // get inputted text
  var textInput = $('#textInput').val().trim().toLowerCase()

  // check that there is actually text there
  if (textInput.length === 0) {
    return alert('Input box is empty!')
  }

  // clear all the canvas elements
  clearCanvases()

  // create array of individual words
  var tokens = tokenArray(textInput)
  var wordCount = tokens.length

  // make the CSV file if selected
  if (document.getElementById('CSVCheck').checked) {
    makeCSV(tokens)
  }

  // generate our match objects
  var PERMA = sortMatches(textInput, permaLex)

  // calculate our important numbers
  var permaCounts = {}
  permaCounts['POS_P'] = getNumbers(PERMA, 'POS_P')
  permaCounts['POS_E'] = getNumbers(PERMA, 'POS_E')
  permaCounts['POS_R'] = getNumbers(PERMA, 'POS_R')
  permaCounts['POS_M'] = getNumbers(PERMA, 'POS_M')
  permaCounts['POS_A'] = getNumbers(PERMA, 'POS_A')
  permaCounts['NEG_P'] = getNumbers(PERMA, 'NEG_P')
  permaCounts['NEG_E'] = getNumbers(PERMA, 'NEG_E')
  permaCounts['NEG_R'] = getNumbers(PERMA, 'NEG_R')
  permaCounts['NEG_M'] = getNumbers(PERMA, 'NEG_M')
  permaCounts['NEG_A'] = getNumbers(PERMA, 'NEG_A')
  permaCounts['POS_T'] = getNumbers(PERMA, 'POS_')
  permaCounts['NEG_T'] = getNumbers(PERMA, 'NEG_')
  permaCounts['TOTAL'] = getNumbers(PERMA, '')

  /* get non-match counts
  var nmPosCount = getNM(PERMA, 'POS_')
  var nmNegCount = getNM(PERMA, 'NEG_')
  var nmPermaCount = nmPosCount + nmNegCount */

  // calculate lexical values
  var permaLV = {}
  permaLV['POS_P'] = calcLex(PERMA.matches['POS_P'], wordCount, permaInt['POS_P'])
  permaLV['POS_E'] = calcLex(PERMA.matches['POS_E'], wordCount, permaInt['POS_E'])
  permaLV['POS_R'] = calcLex(PERMA.matches['POS_R'], wordCount, permaInt['POS_R'])
  permaLV['POS_M'] = calcLex(PERMA.matches['POS_M'], wordCount, permaInt['POS_M'])
  permaLV['POS_A'] = calcLex(PERMA.matches['POS_A'], wordCount, permaInt['POS_A'])
  permaLV['NEG_P'] = calcLex(PERMA.matches['NEG_P'], wordCount, permaInt['NEG_P'])
  permaLV['NEG_E'] = calcLex(PERMA.matches['NEG_E'], wordCount, permaInt['NEG_E'])
  permaLV['NEG_R'] = calcLex(PERMA.matches['NEG_R'], wordCount, permaInt['NEG_R'])
  permaLV['NEG_M'] = calcLex(PERMA.matches['NEG_M'], wordCount, permaInt['NEG_M'])
  permaLV['NEG_A'] = calcLex(PERMA.matches['NEG_A'], wordCount, permaInt['NEG_A'])

  // create printable array of words/tokens
  var permaPrint = handleDuplicates(PERMA.matches)

  // do the same for prospection
  var PROSP = null
  var prospCounts = {}
  var prospLV = {}
  var prospPrint = null
  if (prospectCheck.checked) {
    PROSP = sortMatches(textInput, prospLex)
    prospCounts['PAST'] = getNumbers(PROSP, 'PAST')
    prospCounts['PRESENT'] = getNumbers(PROSP, 'PRESENT')
    prospCounts['FUTURE'] = getNumbers(PROSP, 'PAST')
    prospCounts['TOTAL'] = prospCounts['PAST'] + prospCounts['PRESENT'] + prospCounts['FUTURE']
    prospLV['PAST'] = calcLex(PROSP.matches['PAST'], wordCount, pastInt)
    prospLV['PRESENT'] = calcLex(PROSP.matches['PRESENT'], wordCount, presInt)
    prospLV['FUTURE'] = calcLex(PROSP.matches['FUTURE'], wordCount, futrInt)
    prospPrint = handleDuplicates(PROSP.matches)
  }

  // do the same for affect
  var AFF = null
  var affCounts = {}
  var affLV = {}
  var affPrint = null
  if (affectCheck.checked) {
    AFF = sortMatches(textInput, affLex)
    affCounts['AFFECT'] = getNumbers(AFF, 'AFFECT')
    affCounts['INTENSITY'] = getNumbers(AFF, 'INTENSITY')
    affCounts['TOTAL'] = affCounts['AFFECT'] + affCounts['INTENSITY']
    affLV['AFFECT'] = calcLex(AFF.matches['AFFECT'], wordCount, affInt)
    affLV['INTENSITY'] = calcLex(AFF.matches['INTENSITY'], wordCount, intInt)
    affPrint = handleDuplicates(AFF.matches)
  }

  // do the same for optimism
  var OPT = null
  var optCount = null
  var optLV = {}
  var optPrint = null
  if (optimismCheck.checked) {
    var future = getWords(PROSP, 'FUTURE')
    future = arrToStr(future)
    OPT = sortMatches(future, affLex)
    optCount = getNumbers(OPT, 'AFFECT')
    optLV = calcLex(OPT.matches['AFFECT'], wordCount, affInt)
    optPrint = handleDuplicates(OPT.matches)
  }

  // tokens are different than words ;)
  var tag = 'words'
  if ($('input[id=originalLex]:checked').length > 0) {
    tag = 'tokens'
  }

  // calculate ratio
  var PERMARatioStatement = ''
  if (permaCounts['POS_T'] === 0 || permaCounts['NEG_T'] === 0) {
    if (permaCounts['POS_T'] < permaCounts['NEG_T']) {
      PERMARatioStatement = 'Of the matches, 100% were negative PERMA ' + tag + '.'
    } else if (permaCounts['POS_T'] > permaCounts['NEG_T']) {
      PERMARatioStatement = 'Of the matches, 100% were positive PERMA ' + tag + '.'
    } else if (permaCounts['POS_T'] === permaCounts['NEG_T']) {
      PERMARatioStatement = 'There were no PERMA ' + tag + ' in the input.'
    }
  } else if (permaCounts['POS_T'] < permaCounts['NEG_T']) {
    PERMARatioStatement = 'For every positive PERMA ' + tag + ' there are ' + ((permaCounts['NEG_T'] / permaCounts['POS_T']).toFixed(1)) + ' times as many negative PERMA ' + tag + '.'
  } else if (permaCounts['POS_T'] > permaCounts['NEG_T']) {
    PERMARatioStatement = 'For every negative PERMA ' + tag + ' there are ' + ((permaCounts['POS_T'] / permaCounts['NEG_T']).toFixed(1)) + ' times as many positive PERMA ' + tag + '.'
  } else if (permaCounts['POS_T'] === permaCounts['NEG_T']) {
    PERMARatioStatement = 'There are an equal number of positive and negative PERMA ' + tag + '. 1:1.'
  }

  // display results
  // @todo: this is ugly, is there a better way to do this?
  $('.tw').html(tag)
  $('#wordcount').html(wordCount)
  $('#matches').html(permaCounts['TOTAL'])
  $('#percent').html(((permaCounts['TOTAL'] / (wordCount * 10)) * 100).toFixed(2))
  $('#pmatches').html(permaCounts['POS_T'])
  $('#ppercent').html(((permaCounts['POS_T'] / (wordCount * 5)) * 100).toFixed(2))
  $('#nmatches').html(permaCounts['NEG_T'])
  $('#npercent').html(((permaCounts['NEG_T'] / (wordCount * 5)) * 100).toFixed(2))
  $('#ratio').html(PERMARatioStatement)
  if (originalCheck.checked || spanishCheck.checked) {
    $('#lex').removeClass('hidden')
    $('#ppl').html('P: ' + JSON.stringify(permaLV['POS_P']))
    $('#pel').html('E: ' + JSON.stringify(permaLV['POS_E']))
    $('#prl').html('R: ' + JSON.stringify(permaLV['POS_R']))
    $('#pml').html('M: ' + JSON.stringify(permaLV['POS_M']))
    $('#pal').html('A: ' + JSON.stringify(permaLV['POS_A']))
    $('#npl').html('P: ' + JSON.stringify(permaLV['NEG_P']))
    $('#nel').html('E: ' + JSON.stringify(permaLV['NEG_E']))
    $('#nrl').html('R: ' + JSON.stringify(permaLV['NEG_R']))
    $('#nml').html('M: ' + JSON.stringify(permaLV['NEG_M']))
    $('#nal').html('A: ' + JSON.stringify(permaLV['NEG_A']))
    $('#permaRadar').removeClass('hidden')
  } else {
    $('#lex').addClass('hidden')
    $('#permaRadar').addClass('hidden')
  }
  $('#posP').html(permaPrint.POS_P.join(', '))
  $('#negP').html(permaPrint.POS_E.join(', '))
  $('#posE').html(permaPrint.POS_R.join(', '))
  $('#negE').html(permaPrint.POS_M.join(', '))
  $('#posR').html(permaPrint.POS_A.join(', '))
  $('#negR').html(permaPrint.NEG_P.join(', '))
  $('#posM').html(permaPrint.NEG_E.join(', '))
  $('#negM').html(permaPrint.NEG_R.join(', '))
  $('#posA').html(permaPrint.NEG_M.join(', '))
  $('#negA').html(permaPrint.NEG_A.join(', '))
  if (prospectCheck.checked) {
    $('#prospectRes').removeClass('hidden')
    $('#prospTotal').html(prospCounts['TOTAL'])
    $('#prospCent').html(((prospCounts['TOTAL'] / (wordCount * 3)) * 100).toFixed(2))
    $('#prospPast').html(prospCounts['PAST'])
    $('#pastCent').html(((prospCounts['PAST'] / wordCount) * 100).toFixed(2))
    $('#prospPresent').html(prospCounts['PRESENT'])
    $('#presCent').html(((prospCounts['PRESENT'] / wordCount) * 100).toFixed(2))
    $('#prospFuture').html(prospCounts['FUTURE'])
    $('#futureCent').html(((prospCounts['FUTURE'] / wordCount) * 100).toFixed(2))
    $('#pastLex').html('Past: ' + JSON.stringify(prospLV['PAST']))
    $('#presLex').html('Present: ' + JSON.stringify(prospLV['PRESENT']))
    $('#futrLex').html('Future: ' + JSON.stringify(prospLV['FUTURE']))
    $('#past').html(prospPrint.PAST.join(', '))
    $('#present').html(prospPrint.PRESENT.join(', '))
    $('#future').html(prospPrint.FUTURE.join(', '))
  }
  if (affectCheck.checked) {
    $('#affectRes').removeClass('hidden')
    $('#affTotal').html(affCounts['TOTAL'])
    $('#affCent').html(((affCounts['TOTAL'] / (wordCount * 2)) * 100).toFixed(2))
    $('#affAff').html(affCounts['AFFECT'])
    $('#aCent').html(((affCounts['AFFECT'] / wordCount) * 100).toFixed(2))
    $('#affInt').html(affCounts['INTENSITY'])
    $('#iCent').html(((affCounts['INTENSITY'] / wordCount) * 100).toFixed(2))
    $('#affLex').html('Affect: ' + JSON.stringify(affLV['AFFECT']))
    $('#intLex').html('Intensity: ' + JSON.stringify(affLV['INTENSITY']))
    $('#affPrint').html(affPrint.AFFECT.join(', '))
    $('#intPrint').html(affPrint.INTENSITY.join(', '))
  }
  if (optimismCheck.checked) {
    $('#optimRes').removeClass('hidden')
    $('#optTotal').html(optCount)
    $('#optCent').html(((optCount / wordCount) * 100).toFixed(2))
    $('#optLex').html(optLV)
    $('#optPrint').html(optPrint.AFFECT.join(', '))
  }
  $('#outputSection').removeClass('hidden')

  // remove loading screen
  body.classList.remove('loading')

  // empty containers
}

document.addEventListener('DOMContentLoaded', function loaded () {
  // load initial lexicon
  sortLexicon('permaV3_dd.json', 'perma', permaLex, 'dLoaded')

  // set proper radio button names
  var radios = document.getElementsByName('permaRadio')
  originalCheck = radios[0]
  manualCheck = radios[1]
  tsp75Check = radios[2]

  // event listeners
  $('.startButton').on('click', main)
  originalCheck.addEventListener('click', function () {
    sortLexicon('permaV3_dd.json', 'perma', permaLex, 'dLoaded')
  })
  manualCheck.addEventListener('click', function () {
    sortLexicon('permaV3_manual.json', 'perma', permaLex, 'mLoaded')
  }, false)
  tsp75Check.addEventListener('click', function () {
    sortLexicon('permaV3_manual_tsp75.json', 'perma', permaLex, 'tLoaded')
  }, false)
  prospectCheck.addEventListener('click', function () {
    if (prospectCheck.checked && lexStatus['pLoaded'] === false) {
      sortLexicon('prospection.json', 'prospection', prospLex, 'pLoaded')
    }
    optToggle()
  }, false)
  affectCheck.addEventListener('click', function () {
    if (affectCheck.checked && lexStatus['aLoaded'] === false) {
      sortLexicon('affect.json', 'affect', affLex, 'aLoaded')
    }
    optToggle()
  }, false)
  spanishCheck.addEventListener('click', function () {
    var i = 0
    if (spanishCheck.checked) {
      sortLexicon('dd_spermaV3.json', 'perma', permaLex, 'sLoaded')
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
  document.getElementById('CSVCheck').addEventListener('click', function () {
    var alphaCSV = document.getElementById('alphaCSV')
    var alphaCSVCheck = document.getElementById('alphaCheck')
    if (alphaCSV.classList.contains('disabled')) {
      alphaCSV.classList.remove('disabled')
      alphaCSVCheck.disabled = false
    } else {
      alphaCSV.classList.add('disabled')
      alphaCSVCheck.disabled = true
    }
  }, false)

  // activate tooltips
  $('[data-toggle="tooltip"]').tooltip()

  // global chart options
  Chart.defaults.global.responsive = false
  Chart.defaults.global.fullWidth = true

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
}, {once: true})
