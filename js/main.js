/* jshint globalstrict: true, browser: true, devel: true, sub: true, esversion: 5, asi: true, -W041 */ /* global $, alert */
'use strict'; // eslint-disable-line

var finalArray = {
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

var repeats = {}

// 'endsWith' fallback
if (typeof String.prototype.endsWith !== 'function') {
  String.prototype.endsWith = function (str) { // eslint-disable-line
    return this.slice(-str.length) === str
  }
}

function handleDuplicates (arr, block) {
  var len = arr.length
  var obj = {}
  var item = null
  for (var i = 0; i < len; i++) {
    if (!obj[arr[i]]) {
      obj[arr[i]] = 1
      item = arr[i]
    } else {
      if (!repeats[arr[i]]) {
        repeats[arr[i]] = 2
        item = (arr[i] + '[2]')
      } else {
        repeats[arr[i]]++
        item = (arr[i] + '[' + repeats[arr[i]] + ']')
      }
    }
  }
  if (item != null) finalArray[block].push(' ' + item)
}

function analyseText () {
  // clear previous print and csv buttons if it exists
  var btnCSV = document.getElementById('btnCSV')
  if (btnCSV) {
    btnCSV.parentElement.removeChild(btnCSV)
  }
  document.getElementById('btnPrint').classList.add('hidden')

  // GET TEXT
  var contentDiv = document.getElementById('content')
  var textInput = $('#textInput').val().trim().toLowerCase()
  if (textInput.length === 0) {
    alert('Input box is empty!')
  } else {
    var regex = new RegExp(/\b\S+\b/g)
    var result = null
    var inputArray = []
    while ((result = regex.exec(textInput))) {
      inputArray.push(result[0])
    }

    // generate CSV of tokens and alphabetise if the user has selected this feature
    var genCheck = document.getElementById('generateCSVCheck')
    var alphCheck = document.getElementById('alphabetiseCheck')
    if (genCheck.checked === true) {
      if (alphCheck.checked === true) {
        inputArray.sort()
      }
      var lineArray = []
      inputArray.forEach(function (word, index) {
        word = word.replace(/'/g, '^')
        lineArray.push(word)
      })
      var csvContent = lineArray.join('\n')
      var encodedUri = encodeURI('data:text/csv;charset=UTF-16LE,' + csvContent)
      $('#buttonRow').append("<a class='button' id='csvButton' href='" + encodedUri + "' download='perma_tokens_" + $.now() + ".csv'>Save CSV</a>")
    }

    // ANALYSE TEXT
    var nmCount = 0
    var mCount = 0

    // PERMALex is the PERMAv3 Lexicon and PERMAv3_tsp75 Lexicon from the World Wellbeing Project - www.wwbp.org
    // released under the Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License
    var PERMALex = null
    var shortPERMACheck = document.getElementById('shortPERMACheck')
    if (shortPERMACheck.checked === true) {
      PERMALex = {
        posP: ['joyous', 'comfortable', 'cheerful', 'fabulous', 'entertained', 'grateful', 'exuberant', 'gratified', 'smiling', 'superb', 'blissful', 'gratitude', 'incredible', 'euphoric', 'fortunate', 'wonderful', 'peaceful', 'upbeat', 'lovely', 'cozy', 'ecstatic', 'festive', 'carefree', 'pleasant', 'jovial', 'excellent', 'cheery', 'dazzled', 'jubilant', 'giggling', 'enthusiastic', 'contented', 'optimism', 'grinning', 'delightful', 'laughing', 'gleeful', 'perky', 'cheerfulness', 'radiant', 'optimistic'],
        negP: ['pessimistic', 'discontent', 'perturbed', 'ridiculed', 'cynical', 'pestered', 'dissatisfaction', 'disappointing', 'wrathful', 'bawled', 'bugged', 'doleful', 'displeasure', 'irritable', 'anger', 'constricted', 'contemptuous', 'vulnerable', 'poorly', 'bummed', 'terrorized', 'afraid', 'haughty', 'fuming', 'infuriated', 'startled', 'angry', 'chagrin', 'disgusting', 'grieved', 'glum', 'anguished', 'disheartened', 'unpleasant', 'remorse', 'disgust', 'horrible', 'distraught', 'woeful', 'unhappiness', 'despairing', 'indignant', 'distressing', 'melancholy', 'displeased', 'wary', 'horrid', 'snappy', 'accosted', 'disconcerted', 'ornery', 'grief', 'uneasy', 'shameful', 'ashamed', 'terrified', 'sad', 'disappointed', 'mournful', 'pissed', 'wrath', 'ungrateful', 'disappointment', 'discontented', 'pressured', 'unenthusiastic', 'loathed', 'frustrating', 'grieve', 'bitterness', 'edgy', 'sorrowful', 'angst', 'sadness', 'sour', 'dread', 'insulted', 'misery', 'frantic', 'grieving', 'vexation', 'distressed', 'remorseful', 'repulsed'],
        posE: ['eagerness', 'mindful', 'pursuant', 'persevering', 'inquisitive', 'lively', 'riveted', 'ponder', 'industrious', 'daring', 'eager', 'interesting', 'captivate', 'captivated', 'engrossed', 'fervent', 'spellbinding', 'contemplative', 'fervor', 'tenacity', 'reflective', 'decisive', 'diligence', 'fascination', 'pondering', 'constructive', 'captivates', 'curiosity', 'vigilance', 'dedication', 'attentive', 'adventurous', 'energized', 'diligent', 'mesmerized', 'yearning', 'vivacious', 'keen', 'intrigued', 'transfixed', 'intrigue'],
        negE: ['distracted', 'somnolent', 'sleepy', 'weariness', 'listless', 'stoned', 'disengagement', 'oblivious', 'disinterested', 'idleness', 'tiresome', 'sluggish', 'torpor', 'tedious', 'impartial', 'forgetful', 'weary', 'negligent', 'dreamy', 'boredom', 'numb', 'unmoved', 'interminable', 'inertia', 'distraction', 'restlessness', 'distract', 'disengage', 'oblivion', 'wandering', 'unaware'],
        posR: ['neighbors', 'cordial', 'genial', 'brotherly', 'sincere', 'sociability', 'sincerely', 'amorous', 'interdependence', 'fidelity', 'supportive', 'bonded', 'helpful', 'considerate', 'communicative', 'rapport', 'appreciative', 'charisma', 'endeared', 'cooperation', 'forgiven', 'darling', 'friend', 'loving', 'affectionate', 'collaborate', 'beloved', 'courteous', 'amity', 'forgive', 'interdependent', 'approachable', 'hospitable', 'nurturing', 'entrust', 'altruism', 'friends', 'intimacy', 'endearing', 'kindly', 'kind', 'respectful', 'friendliness', 'befriended', 'tenderness', 'loyal', 'social', 'hospitality', 'nurture', 'entrusted', 'friendship', 'affection'],
        negR: ['accusing', 'envious', 'wronged', 'argumentative', 'dishonest', 'forsaken', 'distrusted', 'accused', 'inhospitable', 'uncooperative', 'obnoxious', 'hate', 'selfish', 'unwelcome', 'resentful', 'deceptive', 'hated', 'jealousy', 'criticised', 'defiant', 'antagonized', 'evasive', 'excommunicated', 'misunderstood', 'mocked', 'insensitive', 'snobbish', 'hostility', 'revenge', 'greedy', 'mocking', 'disobedient', 'contradictory', 'rudeness', 'disloyalty', 'animosity', 'destructive', 'antagonist', 'humiliate', 'alienated', 'tantrum', 'affront', 'misjudged', 'disdain', 'inhumane', 'disobeyed', 'spiteful', 'crotchety', 'offended', 'cruel', 'rancor', 'exiled', 'scornful', 'virulence', 'hatred', 'oppress', 'excommunicate'],
        posM: ['motivation', 'worthwhile', 'moralistic', 'spiritual', 'motive', 'ardent', 'meditation', 'worship', 'doubtless', 'embodiment', 'goal', 'resolute', 'meaningful', 'empowered', 'meditating', 'religiousness', 'symbolizes', 'intention', 'vital', 'meditative', 'essence', 'eclectic', 'scope', 'beauty', 'importance', 'ardor', 'allegiance', 'aspire', 'meditate', 'passionately', 'devout', 'rationale', 'wiser', 'proverb', 'motto', 'convinced', 'marrow', 'pithy', 'wise', 'piety', 'freedom', 'aspiration', 'patriotic', 'passionate'],
        negM: ['superficial', 'aimless', 'haphazardly', 'hollowness', 'meaningless', 'futility', 'worthless', 'invalidated', 'inconsequential', 'dispassionate', 'languishing', 'hopeless', 'disembodied', 'insubstantial', 'useless', 'irresponsible', 'emptiness', 'unnecessary', 'powerless', 'worthlessness'],
        posA: ['adorned', 'accomplishment', 'honored', 'achieved', 'knowledgeable', 'skilled', 'reputable', 'eminence', 'comprehend', 'perfect', 'expert', 'authoritative', 'literate', 'proficient', 'excel', 'fruitful', 'honoured', 'achievement', 'honorable', 'achieving', 'achieve', 'deserving', 'successful', 'famous', 'worthy', 'momentous', 'deserved', 'adept', 'influential', 'proud', 'privileged', 'skillful', 'fruitfulness', 'excellence', 'victory', 'inspirational', 'epitomize', 'vanquish'],
        negA: ['fruitless', 'mundane', 'stagnation', 'dislodged', 'unremarkable', 'deficient', 'inadequate', 'incompetence', 'inadequacy', 'unacceptable', 'unsatisfactory', 'stagnant', 'anonymous', 'demoted', 'mediocrity', 'ordinary', 'incomplete']
      }
    } else {
      PERMALex = {
        posP: ['chirpy', 'satisfied', 'cheerful', 'grateful', 'gratified', 'smiling', 'superb', 'enjoyed', 'happiness', 'soothed', 'renewed', 'amazing', 'bliss', 'enthusiasm', 'enjoying', 'joyful', 'tickled', 'elated', 'carefree', 'placid', 'cool', 'reassured', 'marvelous', 'radiant', 'delightful', 'laughing', 'satiated', 'enjoy', 'warmed', 'exhilarated', 'gladness', 'effervescent', 'bouncy', 'fabulous', 'entertained', 'exuberant', 'encouraged', 'giddy', 'grinning', 'satisfying', 'spry', 'sparkly', 'jolly', 'content', 'enjoyment', 'refreshed', 'gratitude', 'cozy', 'assured', 'festive', 'invigorated', 'pleasant', 'gratefully', 'jovial', 'merry', 'exciting', 'super', 'jubilant', 'great', 'animated', 'contented', 'happy-go-lucky', 'chipper', 'serenity', 'gleeful', 'perky', 'settled', 'giggly', 'fantastic', 'delighted', 'euphoric', 'satisfaction', 'thankful', 'gleaming', 'balanced', 'bubbly', 'tremendous', 'positive', 'comfy', 'wonderful', 'contentment', 'calm', 'peaceful', 'upbeat', 'lovely', 'happy', 'overjoyed', 'relieved', 'relaxed', 'pleased', 'excellent', 'mellow', 'comfortable', 'glad', 'aglow', 'heartwarming', 'optimism', 'spiffy', 'excitement', 'uplifted', 'rad', 'joyous', 'awesome', 'dazzled', 'optimistic', 'blissful', 'tranquil', 'incredible', 'sanguine', 'elevated', 'fortunate', 'terrific', 'elation', 'glowing', 'serene', 'ecstatic', 'thrilled', 'delight', 'rested', 'cheery', 'excited', 'giggling', 'happier', 'enthusiastic', 'exhilerating', 'amused', 'gratefulness', 'pleasure', 'cheerfulness'],
        negP: ['bawling', 'desolate', 'suicidal', 'discontent', 'dissatisfying', 'mortified', 'guilt-ridden', 'outraged', 'glum', 'bugged', 'buggered', 'aggressive', 'afflicted', 'bummed', 'dreadful', 'crabby', 'haughty', 'nervous', 'terrorized', 'downhearted', 'disgusting', 'unhappy', 'snappy', 'dissatisfied', 'crying', 'outrage', 'tormented', 'dislike', 'malcontent', 'hideous', 'indignant', 'mopey', 'petrified', 'testy', 'devastated', 'joyless', 'dread', 'cranky', 'bombarded', 'crestfallen', 'loath', 'suffering', 'gloomy', 'haunted', 'hassled', 'awful', 'interrogated', 'fretting', 'disappointed', 'startled', 'moody', 'contemptuous', 'peeved', 'wrathful', 'yucky', 'nauseous', 'dejected', 'worried', 'anxious', 'loathed', 'aggravation', 'unstable', 'disgruntled', 'averse', 'aggrieved', 'conflicted', 'vexation', 'panic-stricken', 'repulsed', 'demoralized', 'unsatisfied', 'miffed', 'whiney', 'regret', 'cynical', 'pestered', 'exasperated', 'pissy', 'aggravated', 'depressed', 'uncomfortable', 'horrendous', 'bleak', 'disturbing', 'loathing', 'irritated', 'depress', 'soured', 'stressful', 'horrid', 'infuriated', 'forlorn', 'fed-up', 'discouraging', 'dire', 'anguished', 'disheartened', 'irk', 'remorse', 'humiliation', 'horrible', 'screwed', 'distraught', 'claustrophobic', 'poorly', 'frustrated', 'despairing', 'distressing', 'melancholy', 'unsure', 'strained', 'sorrow', 'fedup', 'threatened', 'regretful', 'displeasure', 'disconcerted', 'uneasy', 'icky', 'asinine', 'terrified', 'irritable', 'grieved', 'pissed', 'melancholic', 'discontented', 'bristling', 'unenthusiastic', 'distressed', 'deprived', 'guilty', 'terrible', 'worrying', 'unexcited', 'lousy', 'despair', 'repulsion', 'disappointment', 'misery', 'sullen', 'grieving', 'sorrowful', 'irked', 'enraged', 'perturbed', 'panicked', 'ridiculed', 'sulky', 'fussy', 'god-awful', 'petulant', 'apprehensive', 'dissatisfaction', 'embarrassed', 'bothered', 'frightened', 'nervy', 'unhappiness', 'cheerless', 'frazzled', 'wrath', 'homesick', 'angry', 'under-pressure', 'shame', 'chagrin', 'unpleasant', 'shaken', 'frustration', 'crummy', 'bitter', 'scared', 'wretched', 'disgust', 'abysmal', 'wary', 'unsettled', 'doomed', 'cruddy', 'dreary', 'crankiness', 'grief', 'tense', 'ashamed', 'low-spirited', 'abject', 'crappy', 'fretful', 'sorry', 'ungrateful', 'troubled', 'uncertain', 'rage', 'fearful', 'hysterical', 'bloated', 'grieve', 'bitterness', 'irate', 'sadness', 'sour', 'insulted', 'grief-stricken', 'angsty', 'frustrating', 'panicky', 'pessimistic', 'agonized', 'attacked', 'grouchy', 'desperate', 'horrific', 'humiliated', 'dismayed', 'broody', 'bad-tempered', 'sad', 'disappointing', 'strain', 'bawled', 'frantic', 'downcast', 'moping', 'miserable', 'anger', 'constricted', 'vulnerable', 'loathe', 'unbearable', 'constrained', 'fuming', 'agony', 'beastly', 'shocked', 'struggling', 'disturbed', 'disquieted', 'agitated', 'woeful', 'anxiety', 'panic', 'unbalanced', 'PMSing', 'displeased', 'disgraced', 'stressed', 'accosted', 'ornery', 'despondent', 'disgusted', 'brooding', 'afraid', 'mad', 'discouraged', 'alarmed', 'shamed', 'depressing', 'disheartening', 'pressured', 'shitty', 'angst', 'doleful', 'upset', 'edgy', 'trapped', 'seething', 'remorseful', 'furious', 'grumpy', 'mournful', 'annoyed', 'bereaved', 'shameful'],
        posE: ['obdurant', 'riveted', 'transfix', 'agog', 'pursuant', 'yearn', 'innovative', 'vigilant', 'careful', 'devoted', 'avid', 'anticipation', 'interesting', 'eager', 'entranced', 'contemplative', 'fervor', 'persist', 'engulfed', 'persevere', 'motivated', 'captivating', 'captivated', 'captivates', 'earnest', 'compelled', 'cogitation', 'adventurous', 'strive', 'attentiveness', 'immerse', 'headstrong', 'engross', 'intrigued', 'spellbound', 'steadfastness', 'enlivened', 'enthralled', 'committed', 'alive', 'engaging', 'yearning', 'curious', 'energetic', 'attuned', 'hankering', 'fascinated', 'creative', 'contributing', 'obsessive', 'fascinates', 'obsess', 'industrious', 'constructive', 'contemplate', 'single-mindedness', 'concentrate', 'focused', 'pursuit', 'dedication', 'engage', 'diligent', 'mesmerized', 'involved', 'keen', 'pertinacious', 'concentrates', 'commit', 'stimulate', 'enduring', 'persevering', 'inquisitive', 'involvement', 'lively', 'learning', 'captivate', 'engagement', 'reflective', 'decisive', 'enraptured', 'enthrall', 'diligence', 'fascination', 'mesmerize', 'tenacity', 'pondering', 'awake', 'attentive', 'active', 'persisting', 'perseverant', 'pursue', 'vivacious', 'strong-willed', 'determined', 'endure', 'learn', 'inquiring', 'resolved', 'dedicated', 'eagerness', 'mindful', 'mindfulness', 'contribute', 'engaged', 'ponders', 'prevail', 'ponder', 'develop', 'daring', 'seeking', 'engrossed', 'spellbinding', 'stimulated', 'interested', 'absorbed', 'vigilance', 'inclined', 'persistence', 'transfixed', 'obsessed', 'tenacious', 'immersed', 'watchful', 'alert', 'driven', 'obsesses', 'invested', 'curiosity', 'striving', 'fervent', 'energized', 'consumed', 'hard-working', 'intrigue', 'practices', 'amazed'],
        negE: ['uninterested', 'languid', 'humdrum', 'laziness', 'scattered', 'weariness', 'tiredness', 'sidetrack', 'spacey', 'burned out', 'procrastinating', 'somnolence', 'uncurious', 'scatterbrained', 'vacuous', 'planless', 'reluctance', 'dullness', 'indifference', 'delirious', 'sleepy', 'blase', 'uninvolved', 'absenteism', 'negligent', 'dreamy', 'fatigued', 'stoned', 'interminable', 'distraction', 'lackadaisic', 'disinclination', 'drugged', 'oblivion', 'inattentiveness', 'careless', 'apathetic', 'uninteresting', 'unaware', 'uncaring', 'lethargy', 'monotonous', 'tired', 'procrastinates', 'groggy', 'disinclined', 'loopy', 'aloof', 'worn-out', 'bore', 'avoided', 'neglecting', 'dissociated', 'listelessness', 'tiresome', 'reluctant', 'sluggish', 'lethargic', 'indecisive', 'lazy', 'inert', 'woozy', 'torpid', 'meh', 'weary', 'monotony', 'inertia', 'drowsy', 'stupor', 'restlessness', 'disjointed', 'uninspiring', 'disengage', 'lifeless', 'flaky', 'tediousness', 'disoriented', 'demotivated', 'listless', 'paralyzed', 'oblivious', 'restless', 'disinterested', 'disinterest', 'distracted', 'procrastinate', 'bored', 'torpor', 'reverie', 'jaded', 'forgetful', 'boredom', 'absent-minded', 'unmoved', 'inattentive', 'dull', 'wearied', 'indecisiveness', 'sidetracked', 'distract', 'halfhearted', 'idle', 'dazed', 'detached', 'wandering', 'lassitude', 'deadness', 'exhausted', 'blah', 'somnolent', 'depleted', 'disengagement', 'dragging', 'tedious', 'wornout', 'indifferent', 'drained', 'unmotivated', 'idleness', 'lackadaisical', 'tedium', 'impartial', 'ennui', 'yawn', 'fatigue', 'numb', 'lifelessness', 'complacent', 'neglectful', 'apathy', 'unconcerned', 'soporific', 'uneager'],
        posR: ['neighbors', 'befriend', 'endeared', 'endear', 'welcomed', 'agreed', 'altruistic', 'sociability', 'gf', 'perceptive', 'cooperative', 'fidelity', 'caregiver', 'friendship', 'generous', 'bff', 'attraction', 'beloved', 'boyfriend', 'friendly', 'dependability', 'amorous', 'sweetie', 'compassion', 'closeness', 'empathizing', 'caregiving', 'nurturing', 'kindness', 'considerate', 'helpful', 'respectful', 'sincerely', 'compassionate', 'agreement', 'tenderness', 'bonded', 'affiliate', 'team', 'friendliness', 'affiliation', 'comforting', 'endearment', 'dear', 'home', 'affable', 'appreciating', 'concur', 'appreciative', 'encourage', 'cooperation', 'forgiven', 'darling', 'doting', 'affirming', 'caring', 'bf', 'intimate', 'remembered', 'lover', 'interdependent', 'understanding', 'hospitable', 'affiliated', 'sociable', 'togetherness', 'befriended', 'empathy', 'courteous', 'benevolence', 'allied', 'cherish', 'hospitality', 'entrusted', 'liked', 'alliance', 'love', 'kindhearted', 'amore', 'encouraging', 'comforted', 'lovable', 'respectable', 'embraced', 'interdependence', 'dependent', 'charismatic', 'empathetic', 'sympathetic', 'cherishing', 'congeniality', 'cherished', 'sisterly', 'charisma', 'teamwork', 'dependable', 'sisterhood', 'sincere', 'friend', 'loving', 'affectionate', 'sweetheart', 'relationship', 'amity', 'approachable', 'appreciation', 'tenderly', 'dote', 'agreeable', 'altruism', 'appreciated', 'gracious', 'loved', 'kind', 'romantic', 'accommodating', 'attached', 'cuddly', 'harmonious', 'kindly', 'nurture', 'agree', 'affection', 'social', 'cordial', 'genial', 'likable', 'brotherly', 'respecting', 'trusting', 'obliging', 'encouragement', 'helped', 'tender', 'collaborate', 'embrace', 'sincerity', 'girlfriend', 'amour', 'sympathy', 'trusted', 'forgive', 'supportive', 'communicative', 'rapport', 'romance', 'neighborly', 'romancing', 'harmony', 'beau', 'amiable', 'collaborative', 'welcome', 'loyalty', 'helping', 'united', 'connected', 'brotherhood', 'entrust', 'friends', 'endearing', 'loyally', 'goodwill', 'enamored', 'appreciate', 'together', 'charitable', 'loyal', 'nurturant', 'intimacy', 'serving', 'cuddled'],
        negR: ['grievance', 'pester', 'discord', 'nagged', 'forsaken', 'pariah', 'brutalized', 'defiant', 'uncooperative', 'hate', 'badger', 'envy', 'aggravate', 'mistreated', 'hated', 'embittered', 'vex', 'isolation', 'revengeful', 'unapproachable', 'judged', 'snobbish', 'reproof', 'spiteful', 'uncordial', 'disharmonious', 'pestering', 'lonely', 'insensitive', 'cantankerous', 'banned', 'condemnation', 'disagreement', 'denounced', 'unfriendliness', 'disobedient', 'prejudiced', 'slighted', 'affront', 'distrustful', 'enemy', 'detested', 'miff', 'banished', 'broken-hearted', 'disloyal', 'dishonest', 'irascible', 'crotchety', 'misled', 'uncordiality', 'exiled', 'inhumane', 'ban', 'obligated', 'deceived', 'ignored', 'disapproving', 'imposing', 'churlish', 'dislikable', 'oppressed', 'malice', 'accused', 'disagreeable', 'culpable', 'manipulating', 'harassment', 'double-crossed', 'heartache', 'curse', 'disloyalty', 'clash', 'insulting', 'offended', 'dissed', 'foe', 'deserted', 'scorn', 'interrupting', 'combative', 'victimized', 'revenge', 'greedy', 'blame', 'intruding', 'unfriendly', 'detest', 'unwanted', 'disrespectful', 'defensive', 'alone', 'oppress', 'inconsiderate', 'tantrum', 'hostile', 'misjudged', 'disdain', 'snubbed', 'inhumanity', 'disobeyed', 'interrogate', 'disrespected', 'whiny', 'harass', 'depreciated', 'scornful', 'forgotten', 'heartbroken', 'disharmony', 'hatred', 'heartsick', 'blackmailed', 'dehumanized', 'excommunicate', 'over-protective', 'envious', 'wronged', 'cornered', 'argumentative', 'harassed', 'abusive', 'loveless', 'excommunicated', 'unsupported', 'distrusted', 'betrayed', 'inhospitable', 'bullied', 'excommunication', 'untrusting', 'destructive', 'deceptive', 'condemned', 'jealousy', 'anathema', 'insult', 'militant', 'malevolent', 'heavy-hearted', 'misunderstood', 'chastised', 'teased', 'unloved', 'cruelty', 'rejected', 'bitchy', 'mocking', 'manipulative', 'contradictory', 'hateful', 'rudeness', 'evil', 'patronizing', 'bossy', 'humiliate', 'abused', 'nagging', 'abandoned', 'rival', 'chastise', 'tortured', 'enmity', 'cruel', 'criticised', 'opponent', 'oppositional', 'vengeful', 'accusing', 'antisocial', 'rivalry', 'fury', 'dissent', 'suspicious', 'neglected', 'heartless', 'rancor', 'antagonistic', 'affray', 'mocked', 'disliked', 'dismissive', 'contempt', 'unappreciated', 'selfish', 'unwelcome', 'obnoxious', 'snobbery', 'torture', 'clingy', 'malevolence', 'malicious', 'offensive', 'isolated', 'dismissed', 'antagonized', 'evasive', 'anarchistic', 'illwill', 'conflict', 'mislike', 'dishonorable', 'independent', 'scapegoat', 'rude', 'arguing', 'harsh', 'outcast', 'misunderstanding', 'lonesome', 'heartbreaking', 'gripe', 'hostility', 'scorned', 'jealous', 'animosity', 'greediness', 'nag', 'alienated', 'asocial', 'cheated', 'antagonist', 'snobby', 'mislead', 'manipulated', 'virulence', 'cold-hearted', 'resentful'],
        posM: ['represent', 'awed', 'devote', 'essence', 'guided', 'mission', 'valuable', 'moralism', 'lifeblood', 'meditation', 'religious', 'worship', 'impact', 'chosen', 'hopeful', 'religiousness', 'spirituality', 'believing', 'consequential', 'worshiping', 'worth', 'hope', 'real', 'virtuous', 'resolve', 'ardor', 'advocate', 'self-understanding', 'allegiance', 'crux', 'eclectic', 'consecration', 'meditate', 'wiser', 'humbled', 'genuine', 'pious', 'dignity', 'pithy', 'profound', 'zeal', 'calling', 'truth', 'blest', 'self-acceptance', 'passionate', 'essential', 'spiritual', 'religiosity', 'commitment', 'resolute', 'principles', 'motive', 'ardent', 'principled', 'nub', 'theory', 'embodied', 'destiny', 'meditating', 'liberated', 'passion', 'meditative', 'destine', 'lifework', 'core', 'belief', 'idealistic', 'importance', 'embody', 'devout', 'humility', 'motto', 'faith', 'conviction', 'zealous', 'freedom', 'inspired', 'fulfilled', 'pith', 'aspire', 'faithfulness', 'destined', 'purport', 'character', 'symbolic', 'blessed', 'philosophical', 'consecrate', 'moral', 'volunteered', 'quality', 'enlightened', 'doubtless', 'self-confidence', 'intention', 'meaningful', 'sanctifying', 'political', 'symbolizes', 'almighty', 'certain', 'scope', 'insightful', 'direction', 'beauty', 'nirvana', 'determination', 'catalyst', 'believe', 'convinced', 'spirit', 'valued', 'wise', 'piety', 'sanctified', 'aspiration', 'soul', 'value', 'aim', 'allegiant', 'devotedness', 'believed', 'fulfill', 'devotion', 'motivation', 'self-confident', 'worthwhile', 'moralistic', 'precept', 'crusade', 'fulfillment', 'prayer', 'hopefulness', 'validated', 'embodiment', 'goal', 'empowered', 'imbued', 'ideal', 'vital', 'sacred', 'objective', 'principle', 'edifying', 'dutiful', 'passionately', 'patriotic', 'meaning', 'purpose', 'rationale', 'proverb', 'marrow', 'authentic', 'faithful', 'self-acceptant', 'humble', 'self-accepting', 'ultimate', 'self-assured', 'resolution', 'impactful', 'virtue'],
        negM: ['motiveless', 'unworthy', 'impassiveness', 'chaotic', 'fatalistic', 'irresponsible', 'dispassionate', 'unheard', 'inconsequential', 'disembodied', 'existing', 'languishing', 'unpurposed', 'emptiness', 'pointless', 'looser', 'worthlessness', 'trifle', 'directionless', 'superficial', 'adrift', 'lukewarm', 'self-deprecating', 'meaningless', 'trivial', 'futility', 'senseless', 'dispassion', 'hollowness', 'passionless', 'self-hatred', 'piddling', 'haphazard', 'good-for-nothing', 'futile', 'insubstantial', 'nothingness', 'goalless', 'undirected', 'self-loathing', 'useless', 'disenchanted', 'triflng', 'valueless', 'drifting', 'hypocritical', 'insecure', 'unmindful', 'wishy-washy', 'worthless', 'purportless', 'brainwashed', 'surreal', 'floundering', 'invalidated', 'fractured', 'impassive', 'hollow', 'vague', 'world-weary', 'haphazardly', 'devalued', 'self-hating', 'displaced', 'aimless', 'hopelessness', 'unfulfilled', 'devoid', 'vapid', 'drift', 'unnecessary', 'purposeless', 'self-depreciating', 'powerless', 'pointlessness', 'disillusioned', 'hopeless', 'trite', 'flounder', 'meaninglessness', 'senselessness', 'uninspired'],
        posA: ['adorned', 'knowledgeable', 'sage', 'merit', 'produced', 'reputable', 'perfect', 'superior', 'earned', 'accredited', 'comprehend', 'attained', 'compleat', 'admirable', 'achieve', 'exceptional', 'exalted', 'commended', 'famous', 'revered', 'qualified', 'conquer', 'intellectual', 'reap', 'earn', 'first-rate', 'success', 'gifted', 'excellence', 'victory', 'triumph', 'vanquish', 'exceed', 'honored', 'achieved', 'first-class', 'shining', 'accomplish', 'acknowledgment', 'expert', 'literate', 'proficient', 'eminent', 'genius', 'honoured', 'conquering', 'honorable', 'learned', 'mastered', 'masterful', 'virtuoso', 'extraordinary', 'succeed', 'worthy', 'graduated', 'momentous', 'obtained', 'outcompete', 'deserved', 'adept', 'influential', 'accomplished', 'epitomize', 'conquered', 'adroit', 'skilled', 'powerful', 'actualized', 'reached', 'eminence', 'fruitful', 'commendatory', 'adeptness', 'actualize', 'cultured', 'victorious', 'master', 'heroic', 'achieving', 'gained', 'educated', 'complete', 'successful', 'completed', 'finished', 'gain', 'versatile', 'ace', 'glorified', 'accomplishment', 'triumphant', 'savant', 'fruitfulness', 'overcome', 'deserving', 'promoted', 'distinguished', 'admired', 'apprehend', 'aced', 'respected', 'attain', 'acclaimed', 'masterly', 'articulate', 'productive', 'authoritative', 'progressing', 'excel', 'applauded', 'esteemed', 'worshipped', 'privileged', 'exemplify', 'giftedness', 'finish', 'deft', 'attainment', 'reach', 'reverence', 'achievement', 'omnipotent', 'effective', 'proud', 'artful', 'skillful', 'artistic', 'inspirational', 'professional'],
        negA: ['subpar', 'beaten', 'unproductive', 'flawed', 'inadequate', 'overlooked', 'obsolete', 'defeated', 'unsatisfactory', 'inhibited', 'luckless', 'lowly', 'unsuccessful', 'banal', 'mediocre', 'destitute', 'helpless', 'profitless', 'defective', 'discardable', 'idiot', 'ineptness', 'defamed', 'insignificant', 'inadequacy', 'imperfection', 'underwhelmed', 'overwhelmed', 'forgettable', 'failed', 'broken down', 'unable', 'stagnant', 'dishonored', 'demoted', 'undistinguished', 'blundering', 'incompetence', 'inferior', 'artless', 'fruitless', 'unremarkable', 'stagnation', 'imperfect', 'ineffective', 'ineptitude', 'unprofessional', 'inept', 'callow', 'crushed', 'bungling', 'undeserving', 'middling', 'unaccomplished', 'anonymous', 'incompetent', 'amateurish', 'unacceptable', 'ordinary', 'mundane', 'low-quality', 'inferiority', 'dislodged', 'unexceptional', 'unskilled', 'deficient', 'fruitlessness', 'run-of-the-mill', 'lackluster', 'ineffectual', 'disposable', 'common', 'incapable', 'mediocrity', 'substandard', 'incapability', 'incomplete', 'destitution']
      }
    }

    var PERMALexResults = {
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

    // compare the text inputArray against the lexicon ("PERMALex"), dump the results into "PERMALexResults"
    $.each(PERMALex, function (a, b) {
      for (var i = 0; i < inputArray.length; i++) {
        var inputWord = inputArray[i]
        for (var q = 0; q < PERMALex[a].length; q++) {
          var lexWord = PERMALex[a][q]
          if (inputWord === lexWord) {
            PERMALexResults[a].push(inputWord)
            mCount++
          } else {
            nmCount++
          }
        }
      }
    })

    // calculate the number of positive and negative words, if the user has checked the box
    var wordCount = inputArray.length
    var positiveWords = PERMALexResults.posP.length + PERMALexResults.posE.length + PERMALexResults.posR.length + PERMALexResults.posM.length + PERMALexResults.posA.length
    var negativeWords = PERMALexResults.negP.length + PERMALexResults.negE.length + PERMALexResults.negR.length + PERMALexResults.negM.length + PERMALexResults.negA.length
    var posCent = (((positiveWords / wordCount) * 100).toFixed(2))
    var negCent = (((negativeWords / wordCount) * 100).toFixed(2))
    var numberStatement = '<p>' + positiveWords + ' positive PERMA words (' + posCent + '% of word count), and ' + negativeWords + ' negative PERMA words (' + negCent + '% of word count).</p>'

    // calculate ratio
    var ratioStatement = ''
    if (positiveWords === 0 || negativeWords === 0) {
      if (positiveWords < negativeWords) {
        ratioStatement = '<p>I found only negative PERMA words in the input. No ratio to calculate.</p>'
      } else if (positiveWords > negativeWords) {
        ratioStatement = '<p>I found only positive PERMA words in the input. No ratio to calculate.</p>'
      } else if (positiveWords === negativeWords) {
        ratioStatement = '<p>I found no PERMA words in the input. No ratio to calculate.</p>'
      }
    } else if (positiveWords < negativeWords) {
      ratioStatement = '<p>For every positive PERMA word there are ' + ((negativeWords / positiveWords).toFixed(1)) + ' times as many negative PERMA words.</p>'
    } else if (positiveWords > negativeWords) {
      ratioStatement = '<p>For every negative PERMA word there are ' + ((positiveWords / negativeWords).toFixed(1)) + ' times as many positive PERMA words.</p>'
    } else if (positiveWords === negativeWords) {
      ratioStatement = '<p>There are an equal number of positive and negative PERMA words.</p>'
    }

    // remove duplicates from "PERMALexResuts" and dump them to "finalArray" so we can display them neatly
    $.each(PERMALexResults, function (a, b) {
      handleDuplicates(PERMALexResults[a], a)
    })

    // display results
    $('#wordcount').html(wordCount)
    $('#combinations').html((mCount + nmCount))
    $('#matches').html(mCount)
    $('#percent').html(((mCount / wordCount) * 100).toFixed(2))
    $('#numbers').html(numberStatement)
    $('#ratio').html(ratioStatement)
    $('#posP').html(finalArray.posP.toString())
    $('#negP').html(finalArray.negP.toString())
    $('#posE').html(finalArray.posE.toString())
    $('#negE').html(finalArray.negE.toString())
    $('#posR').html(finalArray.posR.toString())
    $('#negR').html(finalArray.negR.toString())
    $('#posM').html(finalArray.posM.toString())
    $('#negM').html(finalArray.negM.toString())
    $('#posA').html(finalArray.posA.toString())
    $('#negA').html(finalArray.negA.toString())
    contentDiv.classList.remove('hidden')

    // append print button
    document.getElementById('btnPrint').classList.remove('hidden')

    // cleanup after everything is displayed
    $.each(finalArray, function (key, value) {
      finalArray[key].length = 0
    })
  }
}

document.addEventListener('DOMContentLoaded', function loaded () {
  // CSV Alphabetizer button toggler
  document.getElementById('generateCSVCheck').addEventListener('click', function (e) {
    var alphaCSV = document.getElementById('alphaCSV')
    if (alphaCSV.classList.contains('hidden')) {
      alphaCSV.classList.remove('hidden')
    } else {
      alphaCSV.classList.add('hidden')
    }
  }, false)

  // event listeners
  document.getElementById('startButton').addEventListener('click', analyseText, false)
  document.getElementById('btnPrint').addEventListener('click', window.print.bind(window), {passive: true})
  document.removeEventListener('DOMContentLoaded', loaded)
}); // eslint-disable-line
