var ref = require('ssb-ref')
var marked = require('ssb-marked')
function noop(){}
var onLink = noop
var extractor = new marked.Renderer()

// prevent html from entering into mention labels.
// code taken from ssb-markdown
extractor.code = function(code, lang, escaped) { return escaped ? unquote(code) : code }
extractor.blockquote = function(quote) { return unquote(quote) }
extractor.html = function(html) { return false }
extractor.heading = function(text, level, raw) { return unquote(text)+' ' }
extractor.hr = function() { return ' --- ' }
extractor.br = function() { return ' ' }
extractor.list = function(body, ordered) { return unquote(body) }
extractor.listitem = function(text) { return '- '+unquote(text) }
extractor.paragraph = function(text) { return unquote(text)+' ' }
extractor.table = function(header, body) { return unquote(header + ' ' + body) }
extractor.tablerow = function(content) { return unquote(content) }
extractor.tablecell = function(content, flags) { return unquote(content) }
extractor.strong = function(text) { return unquote(text) }
extractor.em = function(text) { return unquote(text) }
extractor.codespan = function(text) { return unquote(text) }
extractor.del = function(text) { return unquote(text) }

function unquote (text) {
  return text.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, '\'')
}

extractor.mention = function (_, id) {
  onLink({target: id})
}

extractor.emoji = function (name) {
  onLink({label: name, emoji: true})
}

extractor.hashtag = function (_, hashtag) {
  onLink({target: hashtag})
}

extractor.link = function (href, _, text) {
  onLink({label: text, target: href, embed: false})
}

extractor.image = function (href, _, text) {
  onLink({label: text, target: href, embed: true})
}

function links (s, _onLink) {
  if('string' !== typeof s) return
  onLink = _onLink
  try {
    marked(s, {renderer: extractor, emoji: extractor.emoji})
  } catch(err) {
    console.log(JSON.stringify(s))
    throw err
  }
  onLink = noop
}

module.exports = function (text, opts) {
  var bareFeedNames = opts && opts.bareFeedNames
  var emoji = opts && opts.emoji
  var a = []
  links(text, function (link) {
    if(ref.isFeed(link.target))
      a.push({link: link.target, name: link.label && link.label.replace(/^@/, '')})
    else if(ref.isBlob(link.target)) {
      var result = ref.parseBlob(link.target)
      result.name = link.label
      a.push(result)
    }
    else if(ref.isMsg(link.target))
      a.push({link: link.target, name: link.label})
    else if(bareFeedNames && link.target && link.target[0] === '@')
      a.push({link: link.target[0], name: link.target.substr(1)})
    else if(link.target && link.target[0] === '#')
      a.push({link: link.target})
    else if(emoji && link.emoji)
      a.push({emoji: true, name: link.label})
  })
  return a
}

