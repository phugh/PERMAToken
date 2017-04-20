/* global $, alert, Chart */

// storage for the loaded PERMA lexicon
var permaDLex = {
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
var permaMLex = {
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
var permaTLex = {
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
var permaSLex = {
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
var prospLex = {
  PAST: {},
  PRESENT: {},
  FUTURE: {}
}

// storage for the loaded Affect / Intensity lexicon
var affLex = {
  AFFECT: {},
  INTENSITY: {}
}

// keep track of which lexica are loaded into memory
var lexStatus = {
  'dLoaded': false, // is the permaV3_dd lexicon loaded?
  'mLoaded': false, // is the permaV3_manual lexicon loaded?
  'tLoaded': false, // is the permaV3_manual_tsp75 lexicon loaded?
  'sLoaded': false, // is the spanish lexicon loaded?
  'pLoaded': false, // is the prospection lexicon loaded?
  'aLoaded': false  // is the affect lexicon loaded?
}

// cache elements
var spanishCheck = document.getElementById('spanishCheck')
var prospectCheck = document.getElementById('prospectCheck')
var affectCheck = document.getElementById('affectCheck')
var optimismCheck = document.getElementById('optimismCheck')
var originalCheck = null
var manualCheck = null
var tsp75Check = null

/* #################### *
 * Helper Functions     *
 * #################### */

// is the inputted number even?
function isEven (n) {
  return n % 2 === 0
}

// array contains
Array.prototype.containsArray = function(val) {
  var hash = {};
  for(var i=0; i<this.length; i++) {
      hash[this[i]] = i;
  }
  return hash.hasOwnProperty(val);
}


/**
* Destroy and recreate canvas elements to avoid problems with chart.js
* @function clearCanvases
*/
function clearCanvases () {
  var c = document.getElementsByTagName('canvas')
  for (var i = 0; i < c.length; i++) {
    var x = c[i].parentNode
    var canvas = document.createElement('canvas');
    canvas.id = c[i].id
    x.removeChild(c[i])
    x.append(canvas)
  }
}

/**
* Convert array to string
* @function arrToStr
* @param  {array} arr {array to convert}
* @return {string} {string output}
*/
function arrToStr (arr) {
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
    // affix boundary modifiers to the start
    str = '\\b' + str
    // ... and ends with a letter ...
    if (str.match(letterEnd)) {
      // ... affix boundary modifiers to the end as well
      str = str + '\\b'
    }
  }
  /* this is because a lot of the lexicon starts or ends with
  ** punctuation or is just a single letter, e.g. 'o' -
  ** we don't want to match every instance of 'o' just 'o' on its own
  ** i.e. /\bo\b/g */
  return new RegExp(str, opts)
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
  var t = $.now()
  $('#buttonRow').append(
    "<a class='btn btn-default btn-lg' id='csvButton' href='" +
    encodedUri + "' download='perma_tokens_" + t + ".csv'>Save CSV</a>"
  )
    $('#buttonRowBlc').append(
    "<a class='btn btn-default btn-block' id='csvButton' href='" +
    encodedUri + "' download='perma_tokens_" + t + ".csv'>Save CSV</a>"
  )
}

/* #################### *
 * Main Functions       *
 * #################### */

/**
* Load and sort JSON files into the relevant lexicon object
* @function sortLexicon
* @param  {string} file   {JSON file name}
* @param  {string} type   {'perma', 'prospection', or 'affect'}
* @param  {object} obj    {the global lexicon object}
* @param  {string} loader {relevant lexStatus item e.g. dLoaded}
*/
function sortLexicon (file, type, obj, loader) {
  var body = document.getElementsByTagName('body')[0]
  // empty array to store loaded lexicon
  var lex = {}
  // full file name string
  var fileName = 'json/' + type + '/' + file
  // display the loading screen
  body.classList.add('loading')
  // load JSON
  $.getJSON(fileName, function (data) {
    lex = data
  }).then(function () {
    var currentItem = 0
    var lexLength = Object.keys(lex).length
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
* Find and sort matched terms against a lexicon
* @function sortMatches
* @param  {string} str {input string}
* @param  {object} obj {lexicon object}
* @return {object} {object of matched terms and weights}
*/
function sortMatches (str, obj) {
  var matches = {}
  if (typeof str !== 'string') str = str.toString()
  $.each(obj, function (a, b) {
    var match = []
    $.each(b, function (x, y) {
      var term = y.term.toString()
      var exp = fixRegExp(term, 'gi')
      var matches = str.match(exp)
      if (matches) {
        match.push(matches, y.weight)
      }
    })
    matches[a] = match
  })
  return matches
}

/**
* @function getWords
* @param  {object} obj {lexicon matches object}
* @param  {string} str {optional object key to match}
* @return {array} {array of words}
*/
function getWords (obj, str) {
  var store = []
  var i = 0
  $.each(obj, function (a, b) {
    i += 1
    if (a.startsWith(str)) {
      $.each(b, function (x, y) {
        if (isEven(x)) {
          // we don't want to include duplicates across categoies or we
          // might end up with 10x wordcount by accident
          if (i > 1) {
            if (!store.containsArray(y)) store.push(y)
          } else {
            store.push(y)
          }
        }
      })
    }
  })
  return store
}

/**
* Get count of matched items in a category
* @function getCounts
* @param  {object} obj {object to match against}
* @param  {string} str {category key to match}
* @return {number} {final count}
*/
function getCounts (obj, str) {
  str = str || ''
  var store = getWords(obj, str)
  var num = 0
  $.each(store, function (x, y) {
    num += y.length
  })
  return Number(num)
}

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
          list.push(el[0] + '[' + el.length + ']') // i.e. "hello[2]"
        } else {
          list.push(el[0])                         // i.e. "hello"
        }
      }
    })
    out[a] = list
  })
  return out
}

/**
* Calculate lexical values from array
* @function calcLex
* @param  {object} obj {lexicon matches to add}
* @param  {number} wc  {total word count}
* @param  {number} int {intercept value}
* @return {number} {the lexical value}
*/
function calcLex (obj, wc, int) {
  var num = 0
  var counts = []
  var weights = []
  int = int || 0
  $.each(obj, function (a, b) {
    if (isEven(a)) {
      // word frequency
      counts.push(b.length)
    } else {
      // word weight
      weights.push(b)
    }
  })
  var sums = []
  $.each(counts, function (a, b) {
    // (word freq / wordcount) * word weight
    var sum = (counts[a] / wc) * weights[a]
    sums.push(sum)
  })
  num = sums.reduce(function (a, b) { return a + b }, 0)
  num = Number(num) + Number(int)
  return num
}

function main () {
  // display loading screen
  var body = document.getElementsByTagName('body')[0]
  body.classList.add('loading')

  // get inputted text
  var textInput = $('#textInput').val().trim().toLowerCase()

  // check that there is actually text there
  if (textInput.length === 0) {
    body.classList.remove('loading')
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
  var PERMA = null
  if (spanishCheck.checked) {
    PERMA = sortMatches(textInput, permaSLex)
  } else if (manualCheck.checked) {
    PERMA = sortMatches(textInput, permaMLex)
  } else if (tsp75Check.checked) {
    PERMA = sortMatches(textInput, permaTLex)
  } else {
    PERMA = sortMatches(textInput, permaDLex)
  }

  // calculate our important numbers
  var permaCounts = {}
  permaCounts['POS_P'] = getCounts(PERMA, 'POS_P')
  permaCounts['POS_E'] = getCounts(PERMA, 'POS_E')
  permaCounts['POS_R'] = getCounts(PERMA, 'POS_R')
  permaCounts['POS_M'] = getCounts(PERMA, 'POS_M')
  permaCounts['POS_A'] = getCounts(PERMA, 'POS_A')
  permaCounts['NEG_P'] = getCounts(PERMA, 'NEG_P')
  permaCounts['NEG_E'] = getCounts(PERMA, 'NEG_E')
  permaCounts['NEG_R'] = getCounts(PERMA, 'NEG_R')
  permaCounts['NEG_M'] = getCounts(PERMA, 'NEG_M')
  permaCounts['NEG_A'] = getCounts(PERMA, 'NEG_A')
  permaCounts['POS_T'] = getCounts(PERMA, 'POS_')
  permaCounts['NEG_T'] = getCounts(PERMA, 'NEG_')
  permaCounts['TOTAL'] = getCounts(PERMA, '')

  // intercept values
  var permaInt = null
  if (spanishCheck.checked) {
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
      NEG_A: 2.482131179
    }
  } else {
    permaInt = {
      POS_P: 0,
      POS_E: 0,
      POS_R: 0,
      POS_M: 0,
      POS_A: 0,
      NEG_P: 0,
      NEG_E: 0,
      NEG_R: 0,
      NEG_M: 0,
      NEG_A: 0
    }
  }
  var pastInt = (-0.649406376419)
  var presInt = 0.236749577324
  var futrInt = (-0.570547567181)
  var affInt = 5.037104721
  var intInt = 2.399762631

  // calculate lexical values
  var permaLV = {}
  permaLV['POS_P'] = calcLex(PERMA['POS_P'], wordCount, permaInt['POS_P'])
  permaLV['POS_E'] = calcLex(PERMA['POS_E'], wordCount, permaInt['POS_E'])
  permaLV['POS_R'] = calcLex(PERMA['POS_R'], wordCount, permaInt['POS_R'])
  permaLV['POS_M'] = calcLex(PERMA['POS_M'], wordCount, permaInt['POS_M'])
  permaLV['POS_A'] = calcLex(PERMA['POS_A'], wordCount, permaInt['POS_A'])
  permaLV['NEG_P'] = calcLex(PERMA['NEG_P'], wordCount, permaInt['NEG_P'])
  permaLV['NEG_E'] = calcLex(PERMA['NEG_E'], wordCount, permaInt['NEG_E'])
  permaLV['NEG_R'] = calcLex(PERMA['NEG_R'], wordCount, permaInt['NEG_R'])
  permaLV['NEG_M'] = calcLex(PERMA['NEG_M'], wordCount, permaInt['NEG_M'])
  permaLV['NEG_A'] = calcLex(PERMA['NEG_A'], wordCount, permaInt['NEG_A'])

  // create printable array of words/tokens
  var permaPrint = handleDuplicates(PERMA)

  // do the same for prospection
  var PROSP = null
  var prospCounts = {}
  var prospLV = {}
  var prospPrint = null
  if (prospectCheck.checked) {
    PROSP = sortMatches(textInput, prospLex)
    prospCounts['PAST'] = getCounts(PROSP, 'PAST')
    prospCounts['PRESENT'] = getCounts(PROSP, 'PRESENT')
    prospCounts['FUTURE'] = getCounts(PROSP, 'PAST')
    prospCounts['TOTAL'] = getCounts(PROSP, '')
    prospLV['PAST'] = calcLex(PROSP['PAST'], wordCount, pastInt)
    prospLV['PRESENT'] = calcLex(PROSP['PRESENT'], wordCount, presInt)
    prospLV['FUTURE'] = calcLex(PROSP['FUTURE'], wordCount, futrInt)
    prospPrint = handleDuplicates(PROSP)
  }

  // do the same for affect
  var AFF = null
  var affCounts = {}
  var affLV = {}
  var affPrint = null
  if (affectCheck.checked) {
    AFF = sortMatches(textInput, affLex)
    /* affect and intensity match the same words, only the weights are different
     * so we only need to do 'getCounts' once, but calcLex needs both */
    affCounts['AFFECT'] = getCounts(AFF, 'AFFECT')
    affLV['AFFECT'] = calcLex(AFF['AFFECT'], wordCount, affInt)
    affLV['INTENSITY'] = calcLex(AFF['INTENSITY'], wordCount, intInt)
    affPrint = handleDuplicates(AFF)
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
    optCount = getCounts(OPT, 'AFFECT')
    optLV = calcLex(OPT['AFFECT'], wordCount, affInt)
    optPrint = handleDuplicates(OPT)
  }

  // make charts
  var ctx1 = document.getElementById('permaPie').getContext('2d')
  var ctx2 = document.getElementById('permaRad').getContext('2d')
  var piedata = {
    labels: [
      'Positive',
      'Negative'
    ],
    datasets: [
      {
        data: [permaCounts['POS_T'], permaCounts['NEG_T']],
        backgroundColor: [
          '#77dd77',
          '#FF6384'
        ],
        hoverBackgroundColor: [
          '#77dd77',
          '#FF6384'
        ]
      }]
  }
  var radardata = {
    labels: [
      'Emotion',
      'Engagement',
      'Relationships',
      'Meaning',
      'Accomplishment'
    ],
    datasets: [
      {
        label: 'Positive PERMA items',
        backgroundColor: 'rgba(119, 221, 119,0.2)',
        borderColor: '#77dd77',
        pointBackgroundColor: 'rgba(179,181,198,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#77dd77',
        data: [
          permaLV['POS_P'],
          permaLV['POS_E'],
          permaLV['POS_R'],
          permaLV['POS_M'],
          permaLV['POS_A']
        ]
      },
      {
        label: 'Negative PERMA items',
        backgroundColor: 'rgba(255,99,132,0.2)',
        borderColor: 'rgba(255,99,132,1)',
        pointBackgroundColor: 'rgba(255,99,132,1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(255,99,132,1)',
        data: [
          permaLV['NEG_P'],
          permaLV['NEG_E'],
          permaLV['NEG_R'],
          permaLV['NEG_M'],
          permaLV['NEG_A']
        ]
      }
    ]
  }
  var myDoughnutChart = new Chart(ctx1, {
    type: 'pie',
    data: piedata
  })
  var myRadarChart = new Chart(ctx2, { // eslint-disable-line
    type: 'radar',
    data: radardata
  })

  // tokens are different than words ;)
  var tag = 'word'
  if ($('input[id=originalLex]:checked').length > 0) {
    tag = 'token'
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
    PERMARatioStatement = 'For every positive PERMA ' + tag + ' there are ' + ((permaCounts['NEG_T'] / permaCounts['POS_T']).toFixed(1)) + ' times as many negative PERMA ' + tag + 's.'
  } else if (permaCounts['POS_T'] > permaCounts['NEG_T']) {
    PERMARatioStatement = 'For every negative PERMA ' + tag + ' there are ' + ((permaCounts['POS_T'] / permaCounts['NEG_T']).toFixed(1)) + ' times as many positive PERMA ' + tag + 's.'
  } else if (permaCounts['POS_T'] === permaCounts['NEG_T']) {
    PERMARatioStatement = 'There are an equal number of positive and negative PERMA ' + tag + 's. 1:1.'
  }

  // display results
  // @todo: this is ugly, is there a better way to do this?
  $('.tw').html(tag)
  $('#wordcount').html(wordCount)
  $('#matches').html(permaCounts['TOTAL'])
  $('#pmatches').html(permaCounts['POS_T'])
  $('#nmatches').html(permaCounts['NEG_T'])
  $('#ratio').html(PERMARatioStatement)
  if (permaCounts['TOTAL'] > 0) {
    if (originalCheck.checked || spanishCheck.checked) {
      $('#lex').removeClass('hidden')
      $('#ppl').html(JSON.stringify(permaLV['POS_P']))
      $('#pel').html(JSON.stringify(permaLV['POS_E']))
      $('#prl').html(JSON.stringify(permaLV['POS_R']))
      $('#pml').html(JSON.stringify(permaLV['POS_M']))
      $('#pal').html(JSON.stringify(permaLV['POS_A']))
      $('#npl').html(JSON.stringify(permaLV['NEG_P']))
      $('#nel').html(JSON.stringify(permaLV['NEG_E']))
      $('#nrl').html(JSON.stringify(permaLV['NEG_R']))
      $('#nml').html(JSON.stringify(permaLV['NEG_M']))
      $('#nal').html(JSON.stringify(permaLV['NEG_A']))
      $('#permaRadar').removeClass('hidden')
    } else {
      $('#lex').addClass('hidden')
      $('#permaRadar').addClass('hidden')
    }
  } else {
    $('#lex').addClass('hidden')
    $('#permaCharts').addClass('hidden')
    $('#permaBD').addClass('hidden')
  }
  $('#posP').html(permaPrint.POS_P.join(', '))
  $('#negP').html(permaPrint.NEG_P.join(', '))
  $('#posE').html(permaPrint.POS_E.join(', '))
  $('#negE').html(permaPrint.NEG_E.join(', '))
  $('#posR').html(permaPrint.POS_R.join(', '))
  $('#negR').html(permaPrint.NEG_R.join(', '))
  $('#posM').html(permaPrint.POS_M.join(', '))
  $('#negM').html(permaPrint.NEG_M.join(', '))
  $('#posA').html(permaPrint.POS_A.join(', '))
  $('#negA').html(permaPrint.NEG_A.join(', '))
  if (prospectCheck.checked) {
    $('#prospectRes').removeClass('hidden')
    $('#prospTotal').html(prospCounts['TOTAL'])
    $('#prospPast').html(prospCounts['PAST'])
    $('#prospPresent').html(prospCounts['PRESENT'])
    $('#prospFuture').html(prospCounts['FUTURE'])
    $('#pastLex').html(JSON.stringify(prospLV['PAST']))
    $('#presLex').html(JSON.stringify(prospLV['PRESENT']))
    $('#futrLex').html(JSON.stringify(prospLV['FUTURE']))
    $('#past').html(prospPrint.PAST.join(', '))
    $('#present').html(prospPrint.PRESENT.join(', '))
    $('#future').html(prospPrint.FUTURE.join(', '))
  }
  if (affectCheck.checked) {
    $('#affectRes').removeClass('hidden')
    $('#affTotal').html(affCounts['AFFECT'])
    $('#affLex').html(JSON.stringify(affLV['AFFECT']))
    $('#intLex').html(JSON.stringify(affLV['INTENSITY']))
    $('#affPrint').html(affPrint.AFFECT.join(', '))
  }
  if (optimismCheck.checked) {
    $('#optimRes').removeClass('hidden')
    $('#optTotal').html(optCount)
    $('#optLex').html(optLV)
    $('#optPrint').html(optPrint.AFFECT.join(', '))
  }
  $('#outputSection').removeClass('hidden')

  // remove loading screen
  body.classList.remove('loading')
}

document.addEventListener('DOMContentLoaded', function loaded () {
  // load initial lexicon
  sortLexicon('permaV3_dd.json', 'perma', permaDLex, 'dLoaded')

  // set proper radio button names
  var radios = document.getElementsByName('permaRadio')
  originalCheck = radios[0]
  manualCheck = radios[1]
  tsp75Check = radios[2]

  // event listeners
  $('.startButton').on('click', main)
  originalCheck.addEventListener('click', function () {
    if (lexStatus['dLoaded'] === false) {
      sortLexicon('permaV3_dd.json', 'perma', permaDLex, 'dLoaded')
    }
  }, false)
  manualCheck.addEventListener('click', function () {
    if (lexStatus['mLoaded'] === false) {
      sortLexicon('permaV3_manual.json', 'perma', permaMLex, 'mLoaded')
    }
  }, false)
  tsp75Check.addEventListener('click', function () {
    if (lexStatus['tLoaded'] === false) {
      sortLexicon('permaV3_manual_tsp75.json', 'perma', permaTLex, 'tLoaded')
    }
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
      if (lexStatus['sLoaded'] === false) {
        sortLexicon('dd_spermaV3.json', 'perma', permaSLex, 'sLoaded')
      }
      for (i = 0; i < radios.length; i++) {
        radios[i].disabled = true
        radios[i].checked = false
      }
    }
  }, false)
  var englishCheck = document.getElementById('englishCheck')
  englishCheck.addEventListener('click', function () {
    var i = 0
    if (englishCheck.checked) {
      if (lexStatus['mLoaded'] === false) {
        sortLexicon('permaV3_manual.json', 'perma', permaMLex, 'mLoaded')
      }
      for (i = 0; i < radios.length; i++) {
        radios[i].disabled = false
        radios[i].checked = false
      }
      radios[0].checked = true
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
