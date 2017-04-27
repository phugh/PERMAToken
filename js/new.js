/* global $, alert, Chart */

// storage for the loaded lexica
var permaDLex = {}
var permaMLex = {}
var permaTLex = {}
var permaSLex = {}
var prospLex = {}
var affLex = {}
var ageLex = {}
var genderLex = {}

// keep track of which lexica are loaded into memory
var lexStatus = {
  'dLoaded': false, // is the permaV3_dd lexicon loaded?
  'mLoaded': false, // is the permaV3_manual lexicon loaded?
  'tLoaded': false, // is the permaV3_manual_tsp75 lexicon loaded?
  'sLoaded': false, // is the spanish lexicon loaded?
  'pLoaded': false, // is the prospection lexicon loaded?
  'aLoaded': false, // is the affect lexicon loaded?
  'gLoaded': false, // is the gender lexicon loaded?
  'eLoaded': false  // is the age lexicon loaded?
}

// cache elements
var prospectCheck = document.getElementById('prospectCheck')
var affectCheck = document.getElementById('affectCheck')
var optimismCheck = document.getElementById('optimismCheck')
var ageCheck = document.getElementById('ageCheck')
var genderCheck = document.getElementById('genderCheck')
var minWeight = $('#minWeight')
var lMin = $('#lMin')
var lMax = $('#lMax')
var permaSelect = $('#permaSelect')
var encodeSelect = $('#encodeSelect')

/* #################### *
 * Helper Functions     *
 * #################### */

// is the inputted number even?
function isEven (n) {
  return n % 2 === 0
}

// multiple indexes
Array.prototype.indexesOf = function (el) {
  var idxs = []
  for (var i = this.length - 1; i >= 0; i--) {
    if (this[i] === el) {
      idxs.unshift(i)
    }
  }
  return idxs
}

// array contains
Array.prototype.containsArray = function (val) {
  var hash = {}
  for (var i = 0; i < this.length; i++) {
    hash[this[i]] = i
  }
  return hash.hasOwnProperty(val)
}

/**
* Destroy and recreate canvas elements to avoid problems with chart.js
* @function clearCanvases
*/
function clearCanvases () {
  var c = document.getElementsByTagName('canvas')
  for (var i = 0; i < c.length; i++) {
    var x = c[i].parentNode
    var canvas = document.createElement('canvas')
    canvas.id = c[i].id
    x.removeChild(c[i])
    x.append(canvas)
  }
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
  opts = opts || 'g'
  var letterStart = new RegExp(/^[a-zA-Z]/, 'g')
  var letterEnd = /[a-zA-Z](?=\s|$)/g
  // escape special characters first
  str = str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')
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
* Generate a CSV from array and append download button
* @function makeCSV
* @param  {array} arr {array of tokens}
*/
function makeCSV (arr) {
  if (document.getElementById('alphaCheck').checked) {
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

/* #################### *
 * Main Functions       *
 * #################### */

/**
* Load JSON files into the relevant lexicon object
* @function loadLexicon
* @param  {string} file   {JSON file name}
* @param  {object} obj    {the global lexicon object}
* @param  {string} loader {relevant lexStatus item e.g. dLoaded}
*/
function loadLexicon (file, obj, loader) {
  var body = document.getElementsByTagName('body')[0]
  body.classList.add('loading')
  var lex = {}
  $.getJSON(file, function (data) {
    lex = data
  }).then(function () {
    $.each(lex, function (a, b) {
      obj[a] = b
    })
    lexStatus[loader] = true
    body.classList.remove('loading')
  })
}

/**
* Tokenize a string into an array
* @function tokenArray
* @param  {string} str {input string}
* @return {array} {an array of tokens}
*/
function tokenArray (str) {
  // following regexps adapted from http://wwbp.org/downloads/public_data/happierfuntokenizing.zip
  var reg = new RegExp(/(?:(?:\+?[01][\-\s.]*)?(?:[\(]?\d{3}[\-\s.\)]*)?\d{3}[\-\s.]*\d{4})|(?:[<>]?[:;=8>][\-o\*\']?[\)\]\(\[dDpPxX\/\:\}\{@\|\\]|[\)\]\(\[dDpPxX\/\:\}\{@\|\\][\-o\*\']?[:;=8<][<>]?|<3|\(?\(?\#?\(?\(?\#?[>\-\^\*\+o\~][\_\.\|oO\,][<\-\^\*\+o\~][\#\;]?\)?\)?)|(?:(?:http[s]?\:\/\/)?(?:[\w\_\-]+\.)+(?:com|net|gov|edu|info|org|ly|be|gl|co|gs|pr|me|cc|us|gd|nl|ws|am|im|fm|kr|to|jp|sg))|(?:http[s]?\:\/\/)|(?:\[[a-z_]+\])|(?:\/\w+\?(?:\;?\w+\=\w+)+)|<[^>]+>|(?:@[\w_]+)|(?:\#+[\w_]+[\w\'_\-]*[\w_]+)|(?:[a-z][a-z'\-_]+[a-z])|(?:[+\-]?\d+[,\/.:-]\d+[+\-]?)|(?:[\w_]+)|(?:\.(?:\s*\.){1,})|(?:\S)/, 'gi')
  var tokenArray = str.match(reg)
  return tokenArray
}

/**
* @function sortMatches
* @param  {array} arr {array to match against lexicon}
* @param  {object} obj {lexicon object}
* @return {object} {object of matches}
*/
function sortMatches (arr, obj) {
  var sortedMatches = {}
  var min = -9999
  $.each(obj, function (a, b) {
    var matches = []
    $.each(b, function (word, weight) {
      if (permaSelect.val() === '4' || permaSelect.val() === '1') {
        min = parseFloat(minWeight.val())
      }
      if (arr.indexOf(word) > -1 && weight > min) {
        var reps = arr.indexesOf(word).length
        var match = null
        if (reps > 1) {
          var words = []
          for (var x = 0; x < reps; x++) {
            words.push(word)
          }
          match = [words, weight]
        } else {
          match = [word, weight]
        }
        matches.push(match)
      }
    })
    sortedMatches[a] = matches
  })
  return sortedMatches
}

/**
* @function getWords
* @param  {object} obj {lexicon matches object}
* @param  {string} str {optional object key to match}
* @return {array} {array of words}
*/
function getWords (obj, str) {
  var words = []
  $.each(obj, function (a, b) {
    if (a.startsWith(str)) {
      $.each(b, function (x, y) {
        var word = null
        var len = 1
        if (Array.isArray(y[0])) {
          word = y[0][0]
          len = y[0].length
        } else {
          word = y[0]
        }
        if (words.indexOf(word) === -1) {
          for (var i = 0; i < len; i++) {
            words.push(word)
          }
        }
      })
    }
  })
  return words
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
      if (Array.isArray(el[0])) {
        list.push(el[0][0] + '[' + el.length + ']')
      } else {
        list.push(el[0])
      }
    })
    out[a] = list
  })
  return out
}

/**
* Calculate lexical usage from array
* @function calcLex
* @param  {object} obj {lexicon matches to add}
* @param  {number} wc  {total word count}
* @param  {number} int {intercept value}
* @param  {string} type {'perma' or otherwise}
* @return {number} {the lexical value}
*/
function calcLex (obj, wc, int, type) {
  var num = 0
  var counts = []
  var weights = []
  var enc = $('#encodeSelect').val()
  int = int || 0
  type = type || ''
  $.each(obj, function (a, b) {
    if (Array.isArray(b[0])) {
      counts.push(b[0].length)
    } else {
      counts.push(1)
    }
    weights.push(b[1])
  })
  var sums = []
  $.each(counts, function (a, b) {
    var sum
    if (enc === 'binary' && type !== 'x') {
      // word 1 weight + word 2 weight etc...
      sum = weights[a]
    } else {
      // (word freq / wordcount) * word weight
      sum = (b / wc) * weights[a]
    }
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
    alert('Input box is empty!')
    return false
  }

  // remove any existing CSV buttons
  $('#buttonRow').empty()
  $('#buttonRowBlc').empty()

  // clear all the canvas elements
  clearCanvases()

  // create array of individual words
  var tokens = tokenArray(textInput)
  var wordCount = tokens.length

  // make the CSV file if selected
  if (document.getElementById('CSVCheck').checked) {
    var csv = makeCSV(tokens)
    var t = $.now()
    $('#buttonRow').append(
      "<a class='btn btn-default btn-lg' id='csvButton' href='" +
      csv + "' download='perma_tokens_" + t + ".csv'>Save CSV</a>"
    )
    $('#buttonRowBlc').append(
      "<a class='btn btn-default btn-block' id='csvButton' href='" +
      csv + "' download='perma_tokens_" + t + ".csv'>Save CSV</a>"
    )
  }

  // generate our match objects
  var PERMA
  var s = Number($('#permaSelect').val())
  if (s === 4) {
    PERMA = sortMatches(tokens, permaSLex)
  } else if (s === 2) {
    PERMA = sortMatches(tokens, permaMLex)
  } else if (s === 3) {
    PERMA = sortMatches(tokens, permaTLex)
  } else {
    PERMA = sortMatches(tokens, permaDLex)
  }

  // calculate our important numbers
  var permaCounts = {}
  permaCounts['POS_P'] = getWords(PERMA, 'POS_P').length
  permaCounts['POS_E'] = getWords(PERMA, 'POS_E').length
  permaCounts['POS_R'] = getWords(PERMA, 'POS_R').length
  permaCounts['POS_M'] = getWords(PERMA, 'POS_M').length
  permaCounts['POS_A'] = getWords(PERMA, 'POS_A').length
  permaCounts['NEG_P'] = getWords(PERMA, 'NEG_P').length
  permaCounts['NEG_E'] = getWords(PERMA, 'NEG_E').length
  permaCounts['NEG_R'] = getWords(PERMA, 'NEG_R').length
  permaCounts['NEG_M'] = getWords(PERMA, 'NEG_M').length
  permaCounts['NEG_A'] = getWords(PERMA, 'NEG_A').length
  permaCounts['POS_T'] = getWords(PERMA, 'POS_').length
  permaCounts['NEG_T'] = getWords(PERMA, 'NEG_').length
  permaCounts['TOTAL'] = getWords(PERMA, '').length

  // intercept values
  var permaInt = null
  if (s === 4) {
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

  // calculate lexical values
  var permaLV = {}
  permaLV['POS_P'] = calcLex(PERMA['POS_P'], wordCount, permaInt['POS_P'], 'perma')
  permaLV['POS_E'] = calcLex(PERMA['POS_E'], wordCount, permaInt['POS_E'], 'perma')
  permaLV['POS_R'] = calcLex(PERMA['POS_R'], wordCount, permaInt['POS_R'], 'perma')
  permaLV['POS_M'] = calcLex(PERMA['POS_M'], wordCount, permaInt['POS_M'], 'perma')
  permaLV['POS_A'] = calcLex(PERMA['POS_A'], wordCount, permaInt['POS_A'], 'perma')
  permaLV['NEG_P'] = calcLex(PERMA['NEG_P'], wordCount, permaInt['NEG_P'], 'perma')
  permaLV['NEG_E'] = calcLex(PERMA['NEG_E'], wordCount, permaInt['NEG_E'], 'perma')
  permaLV['NEG_R'] = calcLex(PERMA['NEG_R'], wordCount, permaInt['NEG_R'], 'perma')
  permaLV['NEG_M'] = calcLex(PERMA['NEG_M'], wordCount, permaInt['NEG_M'], 'perma')
  permaLV['NEG_A'] = calcLex(PERMA['NEG_A'], wordCount, permaInt['NEG_A'], 'perma')

  // create printable array of words/tokens
  var permaPrint = handleDuplicates(PERMA)

  // do the same for prospection
  var PROSP = null
  var prospCounts = {}
  var prospLV = {}
  var prospPrint = null
  if (prospectCheck.checked) {
    var pastInt = (-0.649406376419)
    var presInt = 0.236749577324
    var futrInt = (-0.570547567181)
    PROSP = sortMatches(tokens, prospLex)
    prospCounts['PAST'] = getWords(PROSP, 'PAST').length
    prospCounts['PRESENT'] = getWords(PROSP, 'PRESENT').length
    prospCounts['FUTURE'] = getWords(PROSP, 'PAST').length
    prospCounts['TOTAL'] = getWords(PROSP, '').length
    prospLV['PAST'] = calcLex(PROSP['PAST'], wordCount, pastInt, 'prosp')
    prospLV['PRESENT'] = calcLex(PROSP['PRESENT'], wordCount, presInt, 'prosp')
    prospLV['FUTURE'] = calcLex(PROSP['FUTURE'], wordCount, futrInt, 'prosp')
    prospPrint = handleDuplicates(PROSP)
  }

  // do the same for affect
  var AFF = null
  var affCounts = {}
  var affLV = {}
  var affPrint = null
  var affInt = 5.037104721
  if (affectCheck.checked) {
    var intInt = 2.399762631
    AFF = sortMatches(tokens, affLex)
    /* affect and intensity match the same words, only the weights are different
     * so we only need to do 'getWords' once, but calcLex needs both */
    affCounts['AFFECT'] = getWords(AFF, 'AFFECT').length
    affLV['AFFECT'] = calcLex(AFF['AFFECT'], wordCount, affInt, 'aff')
    affLV['INTENSITY'] = calcLex(AFF['INTENSITY'], wordCount, intInt, 'aff')
    affPrint = handleDuplicates(AFF)
  }

  // do the same for optimism
  var OPT = null
  var optCount = null
  var optLV = {}
  var optPrint = null
  if (optimismCheck.checked) {
    var future = getWords(PROSP, 'FUTURE')
    OPT = sortMatches(future, affLex)
    optCount = getWords(OPT, 'AFFECT').length
    optLV = calcLex(OPT['AFFECT'], wordCount, affInt, 'aff')
    optPrint = handleDuplicates(OPT)
  }

  // do the same for age
  var AGE
  var ageLV = {}
  if (ageCheck.checked) {
    var ageInt = 23.2188604687
    AGE = sortMatches(tokens, ageLex)
    ageLV = calcLex(AGE['AGE'], wordCount, ageInt, 'x')
  }

  // do the same for gender
  var GENDER
  var genderLV
  if (genderCheck.checked) {
    var genInt = (-0.06724152)
    GENDER = sortMatches(tokens, genderLex)
    genderLV = calcLex(GENDER['GENDER'], wordCount, genInt, 'x')
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
  var myRadarChart = new Chart(ctx2, {
    type: 'radar',
    data: radardata
  })

  // calculate ratio
  var PERMARatioStatement = ''
  if (permaCounts['POS_T'] === 0 || permaCounts['NEG_T'] === 0) {
    if (permaCounts['POS_T'] < permaCounts['NEG_T']) {
      PERMARatioStatement = 'Of the matches, 100% were negative PERMA matches.'
    } else if (permaCounts['POS_T'] > permaCounts['NEG_T']) {
      PERMARatioStatement = 'Of the matches, 100% were positive PERMA matches.'
    } else if (permaCounts['POS_T'] === permaCounts['NEG_T']) {
      PERMARatioStatement = 'There were no PERMA matches in the input.'
    }
  } else if (permaCounts['POS_T'] < permaCounts['NEG_T']) {
    PERMARatioStatement = 'For every positive PERMA match there are ' + ((permaCounts['NEG_T'] / permaCounts['POS_T']).toFixed(3)) + ' times as many negative PERMA matches.'
  } else if (permaCounts['POS_T'] > permaCounts['NEG_T']) {
    PERMARatioStatement = 'For every negative PERMA match there are ' + ((permaCounts['POS_T'] / permaCounts['NEG_T']).toFixed(3)) + ' times as many positive PERMA matches.'
  } else if (permaCounts['POS_T'] === permaCounts['NEG_T']) {
    PERMARatioStatement = 'There are an equal number of positive and negative PERMA matches. 1:1.'
  }

  // display results
  // @todo: this is ugly, is there a better way to do this?
  $('#wordcount').html(wordCount)
  $('#matches').html(permaCounts['TOTAL'])
  $('#pmatches').html(permaCounts['POS_T'])
  $('#nmatches').html(permaCounts['NEG_T'])
  $('#ratio').html(PERMARatioStatement)
  if (permaCounts['TOTAL'] > 0) {
    if (s === 1 || s === 4) {
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
  if (ageCheck.checked) {
    $('#ageRes').removeClass('hidden')
    $('#predAge').html(ageLV.toFixed(2))
  }
  if (genderCheck.checked) {
    $('#genRes').removeClass('hidden')
    var g = 'Female'
    if (genderLV < 0) g = 'Male'
    $('#predGen').html(g)
    $('#genLex').html(JSON.stringify(genderLV))
  }
  $('#outputSection').removeClass('hidden')

  // remove loading screen
  body.classList.remove('loading')
}

document.addEventListener('DOMContentLoaded', function loaded () {
  // load initial lexicon
  loadLexicon('json/perma/permaV3_dd.json', permaDLex, 'dLoaded')

  // set min/max weights
  minWeight.attr({'min': -0.37, 'max': 0.85}).val(-0.37)
  lMin.html('-0.37')
  lMax.html('0.85')

  // event listeners
  $('.startButton').on('click', main)
  permaSelect.on('change', function () {
    var i = Number(permaSelect.val())
    if (i === 1) {
      if (lexStatus['dLoaded'] === false) {
        loadLexicon('json/perma/permaV3_dd.json', permaDLex, 'dLoaded')
      }
      encodeSelect.prop('disabled', false)
      minWeight.prop('disabled', false).attr({'min': -0.37, 'max': 0.85}).val(-0.37)
    } else if (i === 2) {
      if (lexStatus['mLoaded'] === false) {
        loadLexicon('json/perma/permaV3_manual.json', permaMLex, 'mLoaded')
      }
      encodeSelect.prop('disabled', true)
      minWeight.prop('disabled', true)
    } else if (i === 3) {
      if (lexStatus['tLoaded'] === false) {
        loadLexicon('json/perma/permaV3_manual_tsp75.json', permaTLex, 'tLoaded')
      }
      encodeSelect.prop('disabled', true)
      minWeight.prop('disabled', true)
    } else if (i === 4) {
      if (lexStatus['sLoaded'] === false) {
        loadLexicon('json/perma/dd_spermaV3.json', permaSLex, 'sLoaded')
      }
      encodeSelect.prop('disabled', false)
      minWeight.prop('disabled', false).attr({'min': -0.85, 'max': 3.32}).val(-0.85)
    } else {
      console.error('#permaSelect: invalid selection. Defaulting to 1.')
      permaSelect.val('1')
    }
    lMin.html(minWeight.attr('min'))
    lMax.html(minWeight.attr('max'))
  })
  prospectCheck.addEventListener('click', function () {
    if (prospectCheck.checked && lexStatus['pLoaded'] === false) {
      loadLexicon('json/prospection/prospection.json', prospLex, 'pLoaded')
    }
    optToggle()
  }, false)
  affectCheck.addEventListener('click', function () {
    if (affectCheck.checked && lexStatus['aLoaded'] === false) {
      loadLexicon('json/affect/affect.json', affLex, 'aLoaded')
    }
    optToggle()
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
  ageCheck.addEventListener('click', function () {
    if (ageCheck.checked && lexStatus['eLoaded'] === false) {
      loadLexicon('json/age/age.json', ageLex, 'eLoaded')
    }
  }, false)
  genderCheck.addEventListener('click', function () {
    if (genderCheck.checked && lexStatus['gLoaded'] === false) {
      loadLexicon('json/gender/gender.json', genderLex, 'gLoaded')
    }
  }, false)

  // activate popovers
  $('[data-toggle="popover"]').popover()

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
